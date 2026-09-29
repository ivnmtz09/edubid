from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.http import HttpResponse
from .models import Institution
from .serializers import InstitutionSerializer, RectorInstitutionSerializer, PublicInstitutionSerializer
from apps.common.reports import (
    generar_pdf_reporte_institucional,
    generar_excel_reporte_institucional,
    obtener_stats_institucion
)


class InstitutionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        user = self.request.user
        if self.action in ('update', 'partial_update') and user.role == 'rector':
            return RectorInstitutionSerializer
        if self.action in ('create',) and user.role != 'admin':
            return RectorInstitutionSerializer
        return InstitutionSerializer

    def get_queryset(self):
        if self.action in ('list', 'retrieve') and not self.request.user.is_authenticated:
            return Institution.objects.filter(activo=True)
        user = self.request.user
        if user.role == 'admin':
            return Institution.objects.all()
        if user.role == 'rector':
            return Institution.objects.filter(id=user.institucion_id)
        return Institution.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied('Solo el administrador global puede crear instituciones.')
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'rector':
            if serializer.instance.id != user.institucion_id:
                raise PermissionDenied('No puedes modificar una institución que no te pertenece.')
            # El rector no puede cambiar campos administrativos
            protected = {'activo', 'codigo_dane'}
            for field in protected:
                if field in serializer.validated_data:
                    del serializer.validated_data[field]
            serializer.save()
        elif user.role == 'admin':
            serializer.save()
        else:
            raise PermissionDenied('No tienes permiso para actualizar instituciones.')

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied('Solo el administrador global puede eliminar instituciones.')
        instance.delete()

    @action(detail=True, methods=["get"], url_path="exportar-pdf", permission_classes=[permissions.IsAuthenticated])
    def exportar_pdf(self, request, pk=None):
        institucion = self.get_object()
        user = request.user
        if user.role != 'admin' and (user.role not in ['rector', 'coordinador'] or user.institucion_id != institucion.id):
            raise PermissionDenied('No tienes permiso para descargar el informe de esta institución.')

        stats = obtener_stats_institucion(institucion)
        pdf_bytes = generar_pdf_reporte_institucional(institucion, stats)
        filename = f"Informe_Institucional_{institucion.codigo_dane or institucion.id}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=["get"], url_path="exportar-excel", permission_classes=[permissions.IsAuthenticated])
    def exportar_excel(self, request, pk=None):
        institucion = self.get_object()
        user = request.user
        if user.role != 'admin' and (user.role not in ['rector', 'coordinador'] or user.institucion_id != institucion.id):
            raise PermissionDenied('No tienes permiso para descargar el informe de esta institución.')

        stats = obtener_stats_institucion(institucion)
        excel_bytes = generar_excel_reporte_institucional(institucion, stats)
        filename = f"Informe_Institucional_{institucion.codigo_dane or institucion.id}.xlsx"
        response = HttpResponse(
            excel_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class PublicInstitutionListView(APIView):
    """
    Endpoint público para llenar selects de registro.
    Retorna solo id y nombre de instituciones activas, sin autenticación.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        instituciones = Institution.objects.filter(activo=True).order_by('nombre')
        serializer = PublicInstitutionSerializer(instituciones, many=True)
        return Response(serializer.data)
