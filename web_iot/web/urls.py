from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DataSensorViewSet, ActionViewSet, DeviceViewSet

router = DefaultRouter()
router.register(r"sensors", DataSensorViewSet, basename="sensor")
router.register(r"actions", ActionViewSet, basename="action")
router.register(r"devices", DeviceViewSet, basename="device")

urlpatterns = [
    path("", include(router.urls)),
]