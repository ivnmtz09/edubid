from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.http import HttpResponse
from apps.groups.models import Group
from apps.tokens.models import Wallet
from apps.activities.models import Activity
from apps.users.permissions import AdminOrDocente, IsInstitutionStaffOrDocente
from apps.common.reports import generar_excel_reporte_grupo, generar_pdf_reporte_grupo
from .models import Grade
from .serializers import GradeSerializer, GradeCreateSerializer


class GradeViewSet(viewsets.ModelViewSet):
    """
    Vista de gestión de calificaciones (grades).
    - Los docentes pueden crear y ver calificaciones de sus grupos.
    - Los estudiantes solo pueden ver sus propias notas.
    """
    queryset = Grade.objects.all().select_related("activity", "student", "activity__group")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return GradeCreateSerializer
        return GradeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Grade.objects.all().select_related("activity", "student", "activity__group")
        elif user.role in ["rector", "coordinador"]:
            if user.institucion_id:
                return Grade.objects.filter(
                    activity__group__classroom__docente__institucion_id=user.institucion_id
                ).select_related("activity", "student", "activity__group")
            return Grade.objects.none()
        elif user.role == "docente":
            return Grade.objects.filter(
                activity__group__classroom__docente=user
            ).select_related("activity", "student", "activity__group")
        elif user.role == "estudiante":
            return Grade.objects.filter(student=user).select_related(
                "activity", "student", "activity__group"
            )
        return Grade.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [AdminOrDocente()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        activity = serializer.validated_data.get('activity')
        if user.role != 'admin' and not user.is_superuser:
            if not activity or not activity.group or not activity.group.classroom or activity.group.classroom.docente != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Solo el docente titular de la clase puede calificar actividades de este grupo.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        if user.role != 'admin' and not user.is_superuser:
            if not instance.activity or not instance.activity.group or not instance.activity.group.classroom or instance.activity.group.classroom.docente != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Solo el docente titular de la clase puede modificar esta calificación.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role != 'admin' and not user.is_superuser:
            if not instance.activity or not instance.activity.group or not instance.activity.group.classroom or instance.activity.group.classroom.docente != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Solo el docente titular de la clase puede eliminar esta calificación.")
        instance.delete()

    @action(detail=False, methods=["get"], url_path="mis-notas")
    def mis_notas(self, request):
        """
        Endpoint para que el estudiante vea sus propias calificaciones.
        """
        if request.user.role != "estudiante":
            return Response(
                {"detail": "Este endpoint es solo para estudiantes."},
                status=status.HTTP_403_FORBIDDEN
            )

        grades = Grade.objects.filter(student=request.user).select_related(
            "activity", "activity__group"
        ).order_by("-creado")

        promedio = grades.aggregate(models.Avg("nota"))["nota__avg"] or 0
        total_coins = sum(g.calcular_coins_ganados() for g in grades)

        serializer = self.get_serializer(grades, many=True)

        return Response({
            "promedio_general": round(promedio, 2),
            "total_educoins_ganados": total_coins,
            "calificaciones": serializer.data
        })

    def _get_group_and_report_data(self, request, group_id):
        try:
            group = Group.objects.select_related("classroom", "classroom__docente").get(pk=group_id)
        except Group.DoesNotExist:
            return None, Response(
                {"detail": "Grupo no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar permisos por rol
        user = request.user
        if user.role == "docente":
            if not group.classroom or group.classroom.docente != user:
                return None, Response(
                    {"detail": "No tienes permiso para ver este grupo."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role in ["rector", "coordinador"]:
            if not user.institucion_id:
                return None, Response(
                    {"detail": "No tienes una institución asignada."},
                    status=status.HTTP_403_FORBIDDEN
                )
            docente_inst = getattr(getattr(getattr(group, 'classroom', None), 'docente', None), 'institucion_id', None)
            if docente_inst != user.institucion_id:
                return None, Response(
                    {"detail": "No tienes permiso para acceder a grupos de otra institución."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role != "admin" and not user.is_superuser:
            return None, Response(
                {"detail": "No tienes permiso para consultar este reporte."},
                status=status.HTTP_403_FORBIDDEN
            )

        estudiantes = group.estudiantes.all()
        data = []

        for est in estudiantes:
            grades = Grade.objects.filter(
                student=est,
                activity__group=group
            ).select_related("activity")

            promedio = grades.aggregate(models.Avg("nota"))["nota__avg"] or 0

            wallet = Wallet.objects.filter(
                usuario=est,
                grupo=group,
            ).first()
            
            saldo = wallet.saldo_educoins if wallet else 0

            detalles = [
                {
                    "activity_id": g.activity.id,
                    "activity": g.activity.nombre,
                    "nota": float(g.nota),
                    "educoins_ganados": g.calcular_coins_ganados(),
                    "fecha": g.creado.isoformat() if g.creado else None,
                }
                for g in grades
            ]

            data.append({
                "student_id": est.id,
                "student_name": f"{est.first_name} {est.last_name}".strip() or est.email,
                "student_email": est.email,
                "promedio_nota": round(float(promedio), 2),
                "total_educoins": saldo,
                "total_actividades": grades.count(),
                "detalles": detalles,
            })

        return (group, data), None

    @action(detail=False, methods=["get"], url_path="grupo/(?P<group_id>[^/.]+)/reporte", 
            permission_classes=[IsInstitutionStaffOrDocente])
    def group_report(self, request, group_id=None):
        """
        Genera un reporte completo de notas y educoins por grupo en JSON.
        """
        res, error_resp = self._get_group_and_report_data(request, group_id)
        if error_resp:
            return error_resp
        group, data = res
        return Response({
            "grupo_id": group.id,
            "grupo_nombre": group.nombre,
            "total_estudiantes": len(data),
            "estudiantes": data
        })

    @action(detail=False, methods=["get"], url_path="grupo/(?P<group_id>[^/.]+)/exportar-excel",
            permission_classes=[IsInstitutionStaffOrDocente])
    def export_group_excel(self, request, group_id=None):
        """
        Exporta el reporte consolidado de notas y EduCoins del grupo en formato Excel (.xlsx).
        """
        res, error_resp = self._get_group_and_report_data(request, group_id)
        if error_resp:
            return error_resp
        group, data = res
        excel_bytes = generar_excel_reporte_grupo(group, data)
        filename = f"Reporte_Grupo_{group.codigo or group.id}.xlsx"
        response = HttpResponse(
            excel_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=["get"], url_path="grupo/(?P<group_id>[^/.]+)/exportar-pdf",
            permission_classes=[IsInstitutionStaffOrDocente])
    def export_group_pdf(self, request, group_id=None):
        """
        Exporta el reporte consolidado de notas y EduCoins del grupo en formato PDF.
        """
        res, error_resp = self._get_group_and_report_data(request, group_id)
        if error_resp:
            return error_resp
        group, data = res
        pdf_bytes = generar_pdf_reporte_grupo(group, data)
        filename = f"Reporte_Grupo_{group.codigo or group.id}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=["post"], url_path="calificar-multiple",
            permission_classes=[AdminOrDocente])
    def calificar_multiple(self, request):
        """
        Permite calificar múltiples estudiantes de una actividad de una vez.
        Body: {
            "activity": 1,
            "calificaciones": [
                {"student": 1, "nota": 85, "retroalimentacion": "..."},
                {"student": 2, "nota": 90, "retroalimentacion": "..."}
            ]
        }
        """
        activity_id = request.data.get('activity')
        calificaciones = request.data.get('calificaciones', [])

        if not activity_id or not calificaciones:
            return Response(
                {"detail": "Debes proporcionar activity y calificaciones."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            activity = Activity.objects.get(pk=activity_id)
        except Activity.DoesNotExist:
            return Response(
                {"detail": "Actividad no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.role == "docente" and activity.group.classroom.docente != request.user:
            return Response(
                {"detail": "No puedes calificar actividades de otros docentes."},
                status=status.HTTP_403_FORBIDDEN
            )

        creadas = []
        errores = []

        for cal in calificaciones:
            cal['activity'] = activity_id
            serializer = GradeCreateSerializer(data=cal)
            
            if serializer.is_valid():
                serializer.save()
                creadas.append(serializer.data)
            else:
                errores.append({
                    "student": cal.get('student'),
                    "errores": serializer.errors
                })

        return Response({
            "creadas": len(creadas),
            "errores": len(errores),
            "detalles_creadas": creadas,
            "detalles_errores": errores
        }, status=status.HTTP_201_CREATED if creadas else status.HTTP_400_BAD_REQUEST)