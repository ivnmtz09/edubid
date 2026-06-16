from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from .models import Institution
from .serializers import InstitutionSerializer, RectorInstitutionSerializer


class InstitutionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        if self.action in ('update', 'partial_update') and user.role == 'rector':
            return RectorInstitutionSerializer
        if self.action in ('create',) and user.role != 'admin':
            return RectorInstitutionSerializer
        return InstitutionSerializer

    def get_queryset(self):
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
