#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// Kết nối WiFi
const char* ssid = "phngynvn";
const char* password = "tumotdenchin";


// Kết nối MQTT
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

// Đèn led
#define DEVICE1_PIN 0   // D3 = GPIO0
#define DEVICE2_PIN 2   // D4 = GPIO2
#define DEVICE3_PIN 14  // D5 = GPIO14

// MQTT callback 
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Tin nhan tu topic: ");
  Serial.println(topic);
  Serial.print("Noi dung: ");
  Serial.println(message);

  // Bật/tắt led
  if (String(topic) == "device/control/1") {
    if (message == "ON") {
      digitalWrite(DEVICE1_PIN, HIGH);
      Serial.println(">>> BAT THIET BI 1 (D3)");
    } else if (message == "OFF") {
      digitalWrite(DEVICE1_PIN, LOW);
      Serial.println(">>> TAT THIET BI 1 (D3)");
    }
  }

  if (String(topic) == "device/control/2") {
    if (message == "ON") {
      digitalWrite(DEVICE2_PIN, HIGH);
      Serial.println(">>> BAT THIET BI 2 (D4)");
    } else if (message == "OFF") {
      digitalWrite(DEVICE2_PIN, LOW);
      Serial.println(">>> TAT THIET BI 2 (D4)");
    }
  }

  if (String(topic) == "device/control/3") {
    if (message == "ON") {
      digitalWrite(DEVICE3_PIN, HIGH);
      Serial.println(">>> BAT THIET BI 3 (D5)");
    } else if (message == "OFF") {
      digitalWrite(DEVICE3_PIN, LOW);
      Serial.println(">>> TAT THIET BI 3 (D5)");
    }
  }
}

// reconnect MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi MQTT...");

    // Tạo ClientID ngẫu nhiên để tránh trùng
    String clientId = "ESP8266-";
    clientId += String(random(0xffff), HEX);

    // Kết nối với user/pass
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println(" Thanh cong!");
      // Sub cho 3 thiết bị
      client.subscribe("device/control/1");
      client.subscribe("device/control/2");
      client.subscribe("device/control/3");
    } else {
      Serial.print(" That bai, rc=");
      Serial.print(client.state());
      Serial.println(" -> thu lai sau 5s");
      delay(5000);
    }
  }
}

// SETUP
void setup() {
  Serial.begin(115200);
  delay(10);

  dht.begin();

  // Cấu hình chân thiết bị
  pinMode(DEVICE1_PIN, OUTPUT);
  pinMode(DEVICE2_PIN, OUTPUT);
  pinMode(DEVICE3_PIN, OUTPUT);

  // Mặc định tắt
  digitalWrite(DEVICE1_PIN, LOW);
  digitalWrite(DEVICE2_PIN, LOW);
  digitalWrite(DEVICE3_PIN, LOW);

  // Kết nối WiFi
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Ket noi WiFi thanh cong!");

  // MQTT
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// LOOP
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Đọc cảm biến
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int light = analogRead(LDR_PIN);

  if (isnan(h) || isnan(t)) {
    Serial.println("Loi doc DHT11!");
    return;
  }

  // Publish dữ liệu sensor
  String payload = "{\"temperature\":";
  payload += String(t);
  payload += ",\"humidity\":";
  payload += String(h);
  payload += ",\"light\":";
  payload += String(light);
  payload += "}";

  Serial.println("Gui: " + payload);
  client.publish("sensor/data", payload.c_str());

  delay(2000);
}
