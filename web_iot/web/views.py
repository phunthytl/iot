from .models import *
from .serializers import *
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .filters import *
from web_iot.pagination import CustomPageNumberPagination

class DataSensorViewSet(viewsets.ModelViewSet):
    queryset = DataSensor.objects.all().order_by("-time")
    serializer_class = DataSensorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DataSensorFilter
    search_fields = ['id', 'temperature', 'humidity', 'light', 'time']
    ordering_fields = ['id', 'temperature', 'humidity', 'light', 'time']
    pagination_class = CustomPageNumberPagination


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

    @action(detail=True, methods=["post"])
    def action(self, request, pk=None):
        action_type = request.data.get("action")  # "ON" / "OFF"
        if action_type not in ["ON", "OFF"]:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            device = Device.objects.get(pk=pk)
        except Device.DoesNotExist:
            return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

        # Publish MQTT (nếu sau này cần)
        # from .mqtt_client import start_mqtt
        # client = start_mqtt()
        # client.publish(f"device/control/{pk}", action_type)

        # Save to DB
        Action.objects.create(device=device, action=action_type)

        return Response({"message": f"Device {device.name} set to {action_type}"}, status=status.HTTP_200_OK)


class ActionViewSet(viewsets.ModelViewSet):
    queryset = Action.objects.all().order_by("-time")
    serializer_class = ActionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ActionFilter
    search_fields = ['id', 'device__name', 'action', 'time']
    ordering_fields = ['id', 'device', 'action', 'time']
    pagination_class = CustomPageNumberPagination
