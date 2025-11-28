#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* ssid = "phngynvn";
const char* password = "tumotdenchin";
const char* mqtt_server = "172.20.10.3";
const char* mqtt_user = "user";
const char* mqtt_password = "123456";

WiFiClient espClient;
PubSubClient client(espClient);

#define DHTPIN 4       // D2 = GPIO4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define LDR_PIN A0

#define DEVICE1_PIN 0   // D3
#define DEVICE2_PIN 2   // D4
#define DEVICE3_PIN 14  // D5
#define DEVICE4_PIN 12  // D6
#define DEVICE5_PIN 13  // D7

// Gửi phản hồi MQTT
void sendConfirm(int id, const char* result) {
  String topic = "device/confirm/";
  topic += String(id);
  client.publish(topic.c_str(), result);
  Serial.println("Đã gửi phản hồi: " + topic + " → " + String(result));
}

// Callback MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("\n📩 Nhận từ topic: ");
  Serial.println(topic);
  Serial.print("Nội dung: ");
  Serial.println(message);

  // Danh sách thiết bị
  struct Device {
    int id;
    int pin;
  } devices[] = {
    {1, DEVICE1_PIN},
    {2, DEVICE2_PIN},
    {3, DEVICE3_PIN},
    {4, DEVICE4_PIN},
    {5, DEVICE5_PIN}
  };

  // Xử lý lệnh điều khiển
  for (auto& d : devices) {
    String controlTopic = "device/control/" + String(d.id);
    if (String(topic) == controlTopic) {
      if (message == "ON") {
        digitalWrite(d.pin, HIGH);
        Serial.printf("🔆 BẬT THIẾT BỊ %d (GPIO%d)\n", d.id, d.pin);
        sendConfirm(d.id, "OK");
      } else if (message == "OFF") {
        digitalWrite(d.pin, LOW);
        Serial.printf("💤 TẮT THIẾT BỊ %d (GPIO%d)\n", d.id, d.pin);
        sendConfirm(d.id, "OK");
      } else {
        sendConfirm(d.id, "FAIL");
      }
    }
  }
}

// Kết nối lại MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Kết nối MQTT...");

    String clientId = "ESP8266-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println(" ✅ Thành công!");
      client.subscribe("device/control/1");
      client.subscribe("device/control/2");
      client.subscribe("device/control/3");
      client.subscribe("device/control/4");
      client.subscribe("device/control/5");
      Serial.println("📡 Đã subscribe các topic điều khiển thiết bị");
    } else {
      Serial.print("❌ Lỗi, rc=");
      Serial.print(client.state());
      Serial.println(" → thử lại sau 5s");
      delay(5000);
    }
  }
}

// SETUP
void setup() {
  Serial.begin(115200);
  delay(10);

  dht.begin();

  pinMode(DEVICE1_PIN, OUTPUT);
  pinMode(DEVICE2_PIN, OUTPUT);
  pinMode(DEVICE3_PIN, OUTPUT);
  pinMode(DEVICE4_PIN, OUTPUT);
  pinMode(DEVICE5_PIN, OUTPUT);

  // Tắt tất cả thiết bị khi khởi động
  digitalWrite(DEVICE1_PIN, LOW);
  digitalWrite(DEVICE2_PIN, LOW);
  digitalWrite(DEVICE3_PIN, LOW);
  digitalWrite(DEVICE4_PIN, LOW);
  digitalWrite(DEVICE5_PIN, LOW);

  Serial.print("🔌 Kết nối WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n🌐 WiFi kết nối thành công!");

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// LOOP
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Đọc DHT
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int light = analogRead(LDR_PIN);

  if (isnan(h) || isnan(t)) {
    Serial.println("⚠️ Lỗi đọc DHT11!");
    return;
  }

  // Giá trị "air" ngẫu nhiên 0-100
  int air = random(0, 101);

  // Điều kiện bật/tắt LED cảnh báo (device5)
  if (air > 50) {
    digitalWrite(DEVICE5_PIN, HIGH);
    Serial.println("⚠️ air > 50 → BẬT LED cảnh báo (device5)");
  } else {
    digitalWrite(DEVICE5_PIN, LOW);
    Serial.println("✓ air <= 50 → TẮT LED cảnh báo (device5)");
  }

  // Tạo JSON gửi MQTT
  String payload = "{\"temperature\":";
  payload += String(t);
  payload += ",\"humidity\":";
  payload += String(h);
  payload += ",\"light\":";
  payload += String(light);
  payload += ",\"air\":";
  payload += String(air);
  payload += "}";

  // Gửi MQTT
  client.publish("sensor/data", payload.c_str());
  Serial.println("📤 Gửi sensor/data: " + payload);

  delay(2000);
}