from datetime import datetime, timedelta
import pytz

LOCAL_TZ = pytz.timezone("Asia/Ho_Chi_Minh")

def __local_to_utc(dt_local):
    return LOCAL_TZ.localize(dt_local).astimezone(pytz.UTC)

def __to_utc_range(dt_local, delta):
    start = __local_to_utc(dt_local)
    end = __local_to_utc(dt_local + delta)
    return start, end

def apply_time_filter(qs, value):
    try:
        # yyyy-mm-dd HH:MM:SS
        if len(value) == 19:
            dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
            start, end = __to_utc_range(dt, timedelta(seconds=1))
            return qs.filter(time__gte=start, time__lt=end)

        # yyyy-mm-dd HH:MM
        elif len(value) == 16:
            dt = datetime.strptime(value, "%Y-%m-%d %H:%M")
            start, end = __to_utc_range(dt, timedelta(minutes=1))
            return qs.filter(time__gte=start, time__lt=end)

        # yyyy-mm-dd HH
        elif len(value) == 13:
            dt = datetime.strptime(value, "%Y-%m-%d %H")
            start, end = __to_utc_range(dt, timedelta(hours=1))
            return qs.filter(time__gte=start, time__lt=end)

        # yyyy-mm-dd
        elif len(value) == 10:
            dt = datetime.strptime(value, "%Y-%m-%d")
            start, end = __to_utc_range(dt, timedelta(days=1))
            return qs.filter(time__gte=start, time__lt=end)

        # yyyy-mm
        elif len(value) == 7:
            dt = datetime.strptime(value, "%Y-%m")
            year = dt.year
            month = dt.month
            if month == 12:
                next_month = datetime(year + 1, 1, 1)
            else:
                next_month = datetime(year, month + 1, 1)
            start, end = __to_utc_range(dt, next_month - dt)
            return qs.filter(time__gte=start, time__lt=end)

        # yyyy
        elif len(value) == 4:
            dt = datetime.strptime(value, "%Y")
            start = __local_to_utc(datetime(dt.year, 1, 1))
            end = __local_to_utc(datetime(dt.year + 1, 1, 1))
            return qs.filter(time__gte=start, time__lt=end)

    except ValueError:
        return qs.none()

    return qs

def apply_local_time_search(qs, search):
    if not search:
        return qs, False

    local_tz = pytz.timezone("Asia/Ho_Chi_Minh")

    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H",
        "%Y-%m-%d",
    ]

    for fmt in formats:
        try:
            dt_local = datetime.strptime(search, fmt)
            dt_local = local_tz.localize(dt_local)
            dt_utc = dt_local.astimezone(pytz.UTC)

            # Nếu format chỉ chứa ngày
            if fmt == "%Y-%m-%d":
                start_utc = dt_utc
                end_utc = start_utc + timedelta(days=1)
                return qs.filter(time__gte=start_utc, time__lt=end_utc), True

            search_converted = dt_utc.strftime(fmt)
            return qs.filter(time__icontains=search_converted), True

        except ValueError:
            continue

    return qs, False
