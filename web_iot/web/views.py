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

from rest_framework.viewsets import ViewSet
from .utils_list import *
class ActionViewSet(ViewSet):

    def list(self, request):
        qs = Action.objects.select_related("device").all()

        # GET PARAMS
        search = request.GET.get("search", "")
        device = request.GET.get("device", "")
        action = request.GET.get("action", "")
        time_val = request.GET.get("time", "")
        ordering = request.GET.get("ordering", "-time")
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))

        # TIME FILTER
        if time_val:
            qs = apply_time_filter(qs, time_val)

        # LOCAL TIME SEARCH
        qs, searched_by_time = apply_local_time_search(qs, search)

        # SEARCH TEXT
        if search and not searched_by_time:
            qs = qs.filter(
                Q(id__icontains=search) |
                Q(device__name__icontains=search) |
                Q(action__icontains=search) |
                Q(time__icontains=search)
            )

        # OTHER FILTERS
        if device:
            qs = qs.filter(device__name__icontains=device)
        if action:
            qs = qs.filter(action__icontains=action)

        # ORDERING
        qs = qs.order_by(ordering)

        # PAGINATION
        total = qs.count()
        start = (page - 1) * page_size
        qs = qs[start:start + page_size]

        data = ActionSerializer(qs, many=True).data

        return Response({
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": data
        })
    
class DataSensorViewSet(ViewSet):

    def list(self, request):
        qs = DataSensor.objects.all()

        search = request.GET.get("search", "")
        temp = request.GET.get("temperature", "")
        hum = request.GET.get("humidity", "")
        light = request.GET.get("light", "")
        time_val = request.GET.get("time", "")
        ordering = request.GET.get("ordering", "-time")
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))

        # TIME FILTER
        if time_val:
            qs = apply_time_filter(qs, time_val)

        # LOCAL TIME SEARCH
        qs, searched_by_time = apply_local_time_search(qs, search)

        # SEARCH TEXT
        if search and not searched_by_time:
            qs = qs.filter(
                Q(id__icontains=search) |
                Q(temperature__icontains=search) |
                Q(humidity__icontains=search) |
                Q(light__icontains=search) |
                Q(time__icontains=search)
            )

        # FILTERS
        if temp:
            qs = qs.filter(temperature__icontains=temp)
        if hum:
            qs = qs.filter(humidity__icontains=hum)
        if light:
            qs = qs.filter(light__icontains=light)

        # ORDERING
        qs = qs.order_by(ordering)

        # PAGINATION
        total = qs.count()
        start = (page - 1) * page_size
        qs = qs[start:start + page_size]

        data = DataSensorSerializer(qs, many=True).data

        return Response({
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": data
        })

from .mqtt_client import latest_sensor
from rest_framework.views import APIView

class SensorRealtimeAPIView(APIView):
    def get(self, request):
        return Response(latest_sensor)