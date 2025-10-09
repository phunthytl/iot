import json
import paho.mqtt.client as mqtt
from django.conf import settings

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("MQTT connected successfully")
        client.subscribe("sensor/data")
        client.subscribe("device/control/#")
    else:
        print(f"MQTT connection failed with code {rc}")

def on_message(client, userdata, msg):
    from .models import DataSensor, Action, Device

    topic = msg.topic
    payload = msg.payload.decode()

    if topic == "sensor/data":
        try:
            data = json.loads(payload)
            DataSensor.objects.create(
                temperature=data.get("temperature"),
                humidity=data.get("humidity"),
                light=data.get("light"),
            )
            print("Saved sensor:", data)
        except Exception as e:
            print("Error saving sensor:", e)

    elif topic.startswith("device/control/"):
        try:
            device_id = int(topic.split("/")[2])
            device = Device.objects.filter(pk=device_id).first()
            if device:
                Action.objects.create(device=device, action=payload)
                print(f"Saved device action: {device.name} → {payload}")
            else:
                print(f"Device with id={device_id} not found")
        except Exception as e:
            print("Error saving action:", e)


def start_mqtt():
    client = mqtt.Client()
    client.username_pw_set(
        username=settings.MQTT_USERNAME,
        password=settings.MQTT_PASSWORD,
    )
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 60)
    client.loop_start()
    return client
