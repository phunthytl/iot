from django.apps import AppConfig
from .mqtt_client import start_mqtt
import os

class WebConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "web"

    def ready(self):
        # Chỉ chạy khi process chính khởi động, không phải autoreloader
        if os.environ.get("RUN_MAIN") == "true":
            try:
                from .mqtt_client import start_mqtt
                print("[MQTT] Initializing client...")
                start_mqtt()
            except Exception as e:
                print("[MQTT] Failed to start:", e)