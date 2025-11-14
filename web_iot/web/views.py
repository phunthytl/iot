from .models import *
from .serializers import *
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .filters import *
from web_iot.pagination import CustomPageNumberPagination
from .mqtt_client import *
class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

    @action(detail=True, methods=["post"])
    def control(self, request, pk=None):
        try:
            device = Device.objects.get(pk=pk)
        except Device.DoesNotExist:
            return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

        action_type = request.data.get("action", "").upper()
        if action_type not in ["ON", "OFF"]:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        send_device_command(device.id, action_type)

        return Response({
            "status": "pending",
            "message": f"Đã gửi lệnh {action_type} đến thiết bị {device.name}, chờ phản hồi..."
        }, status=status.HTTP_200_OK)

    # GET /devices/<id>/status/
    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        try:
            device = Device.objects.get(pk=pk)
        except Device.DoesNotExist:
            return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

        state = device_states.get(int(pk))

        if state and state["updated"]:
            return Response({
                "device": device.name,
                "status": state["status"],
                "updated": state["updated"],
            })
        else:
            return Response({
                "device": device.name,
                "status": "OFF",
                "message": "Chưa có phản hồi từ thiết bị."
            })


class ActionViewSet(viewsets.ModelViewSet):
    queryset = Action.objects.all().order_by("-time")
    serializer_class = ActionSerializer
    filter_backends = [DjangoFilterBackend, LocalTimeSearchFilter, filters.OrderingFilter]
    filterset_class = ActionFilter
    search_fields = ['id', 'device__name', 'action', 'time']
    ordering_fields = ['id', 'device', 'action', 'time']
    pagination_class = CustomPageNumberPagination

class DataSensorViewSet(viewsets.ModelViewSet):
    queryset = DataSensor.objects.all().order_by("-time")
    serializer_class = DataSensorSerializer
    filter_backends = [DjangoFilterBackend, LocalTimeSearchFilter, filters.OrderingFilter]
    filterset_class = DataSensorFilter
    search_fields = ['id', 'temperature', 'humidity', 'light', 'time']
    ordering_fields = ['id', 'temperature', 'humidity', 'light', 'time']
    pagination_class = CustomPageNumberPagination

from .mqtt_client import latest_sensor
from rest_framework.views import APIView

class SensorRealtimeAPIView(APIView):
    def get(self, request):
        return Response(latest_sensor)