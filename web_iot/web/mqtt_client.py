import json
import time
import threading
from collections import defaultdict
import paho.mqtt.client as mqtt
from django.conf import settings

#   BIẾN TOÀN CỤC

device_states = defaultdict(lambda: {"status": "UNKNOWN", "updated": None})
last_command = {}
last_confirm_time = defaultdict(float)
DEBOUNCE_SECONDS = 2

last_sensor_time = 0
SENSOR_SAVE_INTERVAL = 2

mqtt_client = None 

latest_sensor = {
    "air": None,
    "time": None,
}

WARNING_LED_NAME = "LED cảnh báo"
warning_led_device = None
warning_led_state = None


# CALLBACKS
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("MQTT connected successfully")
        client.subscribe("sensor/data")
        client.subscribe("device/confirm/#")
        print("Subscribed: sensor/data & device/confirm/#")
    else:
        print(f"MQTT connection failed with code {rc}")


def on_message(client, userdata, msg):

    from .models import DataSensor, Action, Device

    topic = msg.topic
    payload = msg.payload.decode(errors="ignore").strip()
    print(f"[MQTT] {topic} → {payload}")

    # DỮ LIỆU CẢM BIẾN
    if topic == "sensor/data":
        try:
            data = json.loads(payload)
            now = time.time()

            global last_sensor_time, warning_led_device, warning_led_state

            latest_sensor["air"] = data.get("air")
            latest_sensor["time"] = time.strftime("%Y-%m-%d %H:%M:%S")

            # Lưu mỗi 2 giây 1 lần
            if now - last_sensor_time >= SENSOR_SAVE_INTERVAL:
                DataSensor.objects.create(
                    temperature=data.get("temperature"),
                    humidity=data.get("humidity"),
                    light=data.get("light"),
                )
                last_sensor_time = now
                print(f"Saved sensor: {data}")
            else:
                print("Skipped sensor (debounce)")

            # Theo dõi LED cảnh báo dựa trên giá trị air
            try:
                if warning_led_device is None:
                    warning_led_device, _ = Device.objects.get_or_create(name=WARNING_LED_NAME)

                desired_state = "ON" if (data.get("air") or 0) > 50 else "OFF"
                if warning_led_state != desired_state:
                    warning_led_state = desired_state
                    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                    device_states[warning_led_device.id] = {
                        "status": desired_state,
                        "updated": timestamp,
                    }
                    Action.objects.create(device=warning_led_device, action=desired_state)
                    print(f"[AUTO] {WARNING_LED_NAME} → {desired_state}")
            except Exception as e:
                print("Error tracking warning LED:", e)

        except Exception as e:
            print("Error saving sensor:", e)
        return

    # XÁC NHẬN THIẾT BỊ
    if topic.startswith("device/confirm/"):
        try:
            device_id = int(topic.split("/")[2])
            current_time = time.time()

            # Chống spam confirm
            if current_time - last_confirm_time[device_id] < DEBOUNCE_SECONDS:
                print(f"Ignored duplicate confirm for device {device_id}")
                return
            last_confirm_time[device_id] = current_time

            device = Device.objects.filter(pk=device_id).first()
            if not device:
                print(f"Device id={device_id} not found")
                return

            payload_upper = payload.upper()

            # Nếu ESP trả "OK" → dùng trạng thái từ lệnh gần nhất
            if payload_upper == "OK":
                state = last_command.get(device_id, "UNKNOWN")
            elif payload_upper in ["ON", "OFF"]:
                state = payload_upper
            else:
                print(f"{device.name} phản hồi không hợp lệ: {payload}")
                return

            # Cập nhật cache trạng thái
            device_states[device_id] = {
                "status": state,
                "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
            }

            # Ghi vào DB
            Action.objects.create(device=device, action=state)
            print(f"{device.name} đã {state} (MQTT confirm)")

        except Exception as e:
            print("Error handling confirmation:", e)


# HÀM KHỞI TẠO MQTT
def start_mqtt():
    global mqtt_client
    if mqtt_client:
        return mqtt_client

    client = mqtt.Client()
    client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message

    def _loop():
        try:
            client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 60)
            client.loop_forever()
        except Exception as e:
            print(f"MQTT loop error: {e}")

    threading.Thread(target=_loop, daemon=True).start()
    mqtt_client = client
    return mqtt_client


# HÀM GỬI LỆNH
def send_device_command(device_id, action):
    global mqtt_client
    if not mqtt_client:
        mqtt_client = start_mqtt()

    topic = f"device/control/{device_id}"
    mqtt_client.publish(topic, action.upper())
    last_command[device_id] = action.upper()
    print(f"Gửi lệnh {action.upper()} → {topic}")
