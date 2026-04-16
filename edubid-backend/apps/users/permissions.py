from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdmin(BasePermission):
    """
    Permite acceso solo a usuarios con rol 'admin'
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsDocente(BasePermission):
    """
    Permite acceso solo a usuarios con rol 'docente'
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'docente'


class IsEstudiante(BasePermission):
    """
    Permite acceso solo a usuarios con rol 'estudiante'
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'estudiante'


class AdminOrDocente(BasePermission):
    """
    Permite acceso a 'admin' o 'docente'
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.role == 'docente')
        )


class AdminOrReadOnly(BasePermission):
    """
    - Métodos seguros (GET, HEAD, OPTIONS): cualquiera autenticado puede acceder.
    - Métodos de escritura: solo 'admin'.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'