from django.db import models

# Create your models here.

class DataSensor(models.Model):
    temperature = models.FloatField()
    humidity = models.FloatField()
    light = models.FloatField()
    time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Nhiệt độ: {self.temperature}, Độ ẩm: {self.humidity}, Ánh sáng:{self.light} tại {self.time}"
    
class Device(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Action(models.Model):
    ACTION_CHOICES = [
        ("ON", "Bật"),
        ("OFF", "Tắt"),
    ]

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="actions")
    action = models.CharField(max_length=3, choices=ACTION_CHOICES)
    time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.device.name} → {self.action} tại {self.time}"
