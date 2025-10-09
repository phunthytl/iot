from django.apps import AppConfig
from .mqtt_client import start_mqtt
import os

class WebConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "web"

    # def ready(self):
    #     if os.environ.get("RUN_MAIN") == "true":  # chỉ chạy 1 lần sau reload
    #         from .mqtt_client import start_mqtt
    #         start_mqtt()