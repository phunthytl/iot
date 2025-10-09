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