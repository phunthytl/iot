from django.db.models import Q

# 1. Lấy query params
def get_pagination_params(request):
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    return page, page_size


def get_ordering_param(request, default="-time"):
    ordering = request.GET.get("ordering", default)
    if ordering.startswith("-"):
        return ordering[1:], "desc"
    return ordering, "asc"


def get_search_param(request):
    return request.GET.get("search", "")


def get_filter_params(request, fields):
    filters = {}
    for f in fields:
        val = request.GET.get(f, "")
        if val:
            filters[f] = val
    return filters


# 2. Xử lý QuerySet
def apply_search(qs, search, search_fields):
    if not search:
        return qs

    q_obj = Q()
    for field in search_fields:
        q_obj |= Q(**{f"{field}__icontains": search})

    return qs.filter(q_obj)


def apply_filters(qs, filter_params):
    for field, value in filter_params.items():
        qs = qs.filter(**{f"{field}__icontains": value})
    return qs


def apply_order(qs, ordering, direction):
    if direction == "desc":
        ordering = "-" + ordering
    return qs.order_by(ordering)


def apply_pagination(qs, page, page_size):
    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    return qs[start:end], total
