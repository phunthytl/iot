#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// WiFi
const char* ssid = "phngynvn";
const char* password = "tumotdenchin";

// MQTT
const char* mqtt_server = "172.20.10.3";
const char* mqtt_user = "user";
const char* mqtt_password = "123456";

WiFiClient espClient;
PubSubClient client(espClient);

// DHT11
#define DHTPIN 4       // D2 = GPIO4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// LDR
#define LDR_PIN A0

// Các thiết bị
#define DEVICE1_PIN 0   // D3 = GPIO0
#define DEVICE2_PIN 2   // D4 = GPIO2
#define DEVICE3_PIN 14  // D5 = GPIO14

// Hàm gửi phản hồi MQTT sau khi bật/tắt thành công
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

  Serial.print("\nNhận từ topic: ");
  Serial.println(topic);
  Serial.print("Nội dung: ");
  Serial.println(message);

  // Thiết bị 1
  if (String(topic) == "device/control/1") {
    if (message == "ON") {
      digitalWrite(DEVICE1_PIN, HIGH);
      Serial.println("BẬT THIẾT BỊ 1 (D3)");
      sendConfirm(1, "OK");
    } else if (message == "OFF") {
      digitalWrite(DEVICE1_PIN, LOW);
      Serial.println("TẮT THIẾT BỊ 1 (D3)");
      sendConfirm(1, "OK");
    } else {
      sendConfirm(1, "FAIL");
    }
  }

  // Thiết bị 2
  if (String(topic) == "device/control/2") {
    if (message == "ON") {
      digitalWrite(DEVICE2_PIN, HIGH);
      Serial.println("BẬT THIẾT BỊ 2 (D4)");
      sendConfirm(2, "OK");
    } else if (message == "OFF") {
      digitalWrite(DEVICE2_PIN, LOW);
      Serial.println("TẮT THIẾT BỊ 2 (D4)");
      sendConfirm(2, "OK");
    } else {
      sendConfirm(2, "FAIL");
    }
  }

  // Thiết bị 3
  if (String(topic) == "device/control/3") {
    if (message == "ON") {
      digitalWrite(DEVICE3_PIN, HIGH);
      Serial.println("BẬT THIẾT BỊ 3 (D5)");
      sendConfirm(3, "OK");
    } else if (message == "OFF") {
      digitalWrite(DEVICE3_PIN, LOW);
      Serial.println("TẮT THIẾT BỊ 3 (D5)");
      sendConfirm(3, "OK");
    } else {
      sendConfirm(3, "FAIL");
    }
  }
}

// reconnect MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Kết nối MQTT...");

    String clientId = "ESP8266-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println(" Thành công!");
      client.subscribe("device/control/1");
      client.subscribe("device/control/2");
      client.subscribe("device/control/3");
      Serial.println("Đã subscribe các topic device/control/#");
    } else {
      Serial.print("Lỗi, rc=");
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

  digitalWrite(DEVICE1_PIN, LOW);
  digitalWrite(DEVICE2_PIN, LOW);
  digitalWrite(DEVICE3_PIN, LOW);

  Serial.print("Kết nối WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi OK!");

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// LOOP
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Gửi dữ liệu cảm biến
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int light = analogRead(LDR_PIN);

  if (isnan(h) || isnan(t)) {
    Serial.println("Lỗi đọc DHT11!");
    return;
  }

  String payload = "{\"temperature\":";
  payload += String(t);
  payload += ",\"humidity\":";
  payload += String(h);
  payload += ",\"light\":";
  payload += String(light);
  payload += "}";

  client.publish("sensor/data", payload.c_str());
  Serial.println("Gửi sensor/data: " + payload);

  delay(2000);
}
