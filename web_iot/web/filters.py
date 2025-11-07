import django_filters
from .models import *
from datetime import datetime, timedelta

class TimeFilter(django_filters.FilterSet):
    time = django_filters.CharFilter(method="filter_time")

    def filter_time(self, queryset, name, value):
        try:
            if len(value) == 19:  # yyyy-mm-dd HH:MM:SS
                dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                return queryset.filter(time__gte=dt, time__lt=dt + timedelta(seconds=1))

            elif len(value) == 16:  # yyyy-mm-dd HH:MM
                dt = datetime.strptime(value, "%Y-%m-%d %H:%M")
                return queryset.filter(time__gte=dt, time__lt=dt + timedelta(minutes=1))

            elif len(value) == 13:  # yyyy-mm-dd HH
                dt = datetime.strptime(value, "%Y-%m-%d %H")
                return queryset.filter(time__gte=dt, time__lt=dt + timedelta(hours=1))

            elif len(value) == 10:  # yyyy-mm-dd
                dt = datetime.strptime(value, "%Y-%m-%d")
                return queryset.filter(time__gte=dt, time__lt=dt + timedelta(days=1))

        except ValueError:
            return queryset.none()

        return queryset

class DataSensorFilter(TimeFilter):
    class Meta:
        model = DataSensor
        fields = ["time", "temperature", "humidity", "light"]


class ActionFilter(django_filters.FilterSet):
    device = django_filters.CharFilter(field_name="device__name", lookup_expr='icontains')
    action = django_filters.CharFilter(lookup_expr='icontains')
    time = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Action
        fields = ['device', 'action', 'time']

from rest_framework import filters
import pytz
class LocalTimeSearchFilter(filters.SearchFilter):
    """Tự động convert giờ VN (UTC+7) sang UTC trước khi search"""
    def filter_queryset(self, request, queryset, view):
        search_param = request.query_params.get(self.search_param, "")
        if not search_param:
            return queryset

        try:
            local_tz = pytz.timezone("Asia/Ho_Chi_Minh")
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d %H", "%Y-%m-%d"):
                try:
                    dt_local = datetime.strptime(search_param, fmt)
                    dt_local = local_tz.localize(dt_local)
                    dt_utc = dt_local.astimezone(pytz.UTC)

                    # Nếu chỉ nhập ngày (yyyy-mm-dd)
                    if fmt == "%Y-%m-%d":
                        start_utc = dt_utc
                        end_utc = start_utc + timedelta(days=1)
                        return queryset.filter(time__gte=start_utc, time__lt=end_utc)

                    # Còn lại thì thay thế search_param như cũ
                    search_param = dt_utc.strftime(fmt)
                    break
                except ValueError:
                    continue
        except Exception:
            pass

        # Gọi lại SearchFilter gốc
        request._mutable = True
        request.query_params._mutable = True
        request.query_params[self.search_param] = search_param
        request.query_params._mutable = False

        return super().filter_queryset(request, queryset, view)