from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(DataSensor)
admin.site.register(Device)
admin.site.register(Action)