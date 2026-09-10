from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.conf import settings
import math


class EduBidPagination(PageNumberPagination):
    """
    Paginador híbrido inteligente para EduBid:
    - Si la petición incluye parámetros de paginación (?page=, ?page_size=, ?paginate=true),
      retorna una respuesta paginada estructurada con metadatos extendidos (count, total_pages, current_page, etc.).
    - Si la petición NO incluye parámetros de paginación o incluye ?paginate=false,
      retorna None en paginate_queryset, haciendo que DRF devuelva la lista plana completa.
      Esto garantiza compatibilidad 100% hacia atrás con clientes existentes, componentes de Angular y tests.
    """
    page_size = getattr(settings, 'PAGE_SIZE', 20)
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        paginate_param = request.query_params.get('paginate', '').lower()
        has_page = 'page' in request.query_params
        has_page_size = self.page_size_query_param in request.query_params

        # Si explícitamente se desactiva la paginación
        if paginate_param == 'false':
            return None

        # Si se solicita explícitamente paginación
        if has_page or has_page_size or paginate_param == 'true':
            return super().paginate_queryset(queryset, request, view=view)

        # Si la vista define force_paginate = True
        if getattr(view, 'force_paginate', False):
            return super().paginate_queryset(queryset, request, view=view)

        # En peticiones convencionales sin parámetros: entrega el listado completo
        return None

    def get_paginated_response(self, data):
        total_count = self.page.paginator.count
        current_page_size = self.get_page_size(self.request) or self.page_size
        total_pages = math.ceil(total_count / current_page_size) if current_page_size else 1

        return Response({
            'count': total_count,
            'total_pages': total_pages,
            'current_page': self.page.number,
            'page_size': current_page_size,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

