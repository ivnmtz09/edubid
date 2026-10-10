from django.test import TestCase
from apps.users.models import User
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.tokens.models import Period
from apps.ai_assistant.tools import dispatch_tool, AI_TOOLS_DEFINITIONS


class AiAssistantToolsTestCase(TestCase):
    def setUp(self):
        self.docente = User.objects.create_user(
            username="docente_test",
            email="docente_test@edubid.co",
            password="password123",
            role="docente",
            first_name="Docente",
            last_name="Prueba"
        )
        self.estudiante = User.objects.create_user(
            username="estudiante_test",
            email="estudiante_test@edubid.co",
            password="password123",
            role="estudiante",
            first_name="Estudiante",
            last_name="Prueba"
        )
        self.classroom = Classroom.objects.create(nombre="Algoritmos", docente=self.docente)
        self.group = Group.objects.create(classroom=self.classroom, nombre="Grupo 1")
        self.group.estudiantes.add(self.estudiante)
        Period.crear_periodos_para_grupo(self.group)

    def test_ai_tools_definitions_does_not_contain_create_or_delete(self):
        """Verifica que las herramientas expuestas a la IA no contengan funciones de creación o eliminación."""
        tool_names = [t["function"]["name"] for t in AI_TOOLS_DEFINITIONS]
        for name in tool_names:
            self.assertFalse(name.startswith("create_"), f"Herramienta no permitida: {name}")
            self.assertFalse(name.startswith("delete_"), f"Herramienta no permitida: {name}")

    def test_cannot_create_classroom(self):
        """Intento de crear clase vía IA es estrictamente bloqueado."""
        result = dispatch_tool("create_classroom", {"nombre": "Programación Web"}, self.docente)
        self.assertEqual(result.get("status"), "error")
        self.assertIn("Acción no permitida", result.get("error", ""))
        self.assertFalse(Classroom.objects.filter(nombre="Programación Web").exists())

    def test_cannot_create_group(self):
        """Intento de crear grupo vía IA es estrictamente bloqueado."""
        result = dispatch_tool("create_group", {"classroom_id": self.classroom.id, "nombre": "Grupo 2"}, self.docente)
        self.assertEqual(result.get("status"), "error")
        self.assertIn("Acción no permitida", result.get("error", ""))
        self.assertFalse(Group.objects.filter(classroom=self.classroom, nombre="Grupo 2").exists())

    def test_cannot_create_classroom_with_groups(self):
        """Intento de crear clase con grupos vía IA es estrictamente bloqueado."""
        result = dispatch_tool(
            "create_classroom_with_groups",
            {"nombre_asignatura": "Desarrollo Móvil", "nombres_grupos": ["A1", "B1"]},
            self.docente
        )
        self.assertEqual(result.get("status"), "error")
        self.assertIn("Acción no permitida", result.get("error", ""))
        self.assertFalse(Classroom.objects.filter(nombre="Desarrollo Móvil").exists())

    def test_cannot_delete_classroom_or_group(self):
        """Intento de eliminar clase o grupo vía IA es estrictamente bloqueado."""
        res_del_grp = dispatch_tool("delete_group", {"grupo_id": self.group.id}, self.docente)
        self.assertEqual(res_del_grp.get("status"), "error")
        self.assertTrue(Group.objects.filter(id=self.group.id).exists())

        res_del_cls = dispatch_tool("delete_classroom", {"classroom_id": self.classroom.id}, self.docente)
        self.assertEqual(res_del_cls.get("status"), "error")
        self.assertTrue(Classroom.objects.filter(id=self.classroom.id).exists())

    def test_get_my_classrooms_and_groups_success(self):
        """Consulta permitida de asignaturas y grupos."""
        result = dispatch_tool("get_my_classrooms_and_groups", {}, self.docente)
        self.assertEqual(result.get("total_asignaturas"), 1)
        self.assertEqual(result.get("total_grupos"), 1)
        self.assertEqual(result["asignaturas"][0]["asignatura"], "Algoritmos")

    def test_get_classroom_students_success(self):
        """Consulta permitida de estudiantes de un grupo."""
        result = dispatch_tool("get_classroom_students", {"grupo_id": self.group.id}, self.docente)
        self.assertEqual(result.get("grupo_nombre"), "Grupo 1")
        self.assertEqual(result.get("total_estudiantes"), 1)
        self.assertEqual(result["estudiantes"][0]["email"], self.estudiante.email)

    def test_award_educoins_success(self):
        """Abono de EduCoins por mérito permitido para el docente."""
        result = dispatch_tool(
            "award_educoins",
            {
                "grupo_id": self.group.id,
                "estudiante_identificador": self.estudiante.email,
                "cantidad": 50,
                "motivo": "Participación activa"
            },
            self.docente
        )
        self.assertEqual(result.get("status"), "success")
        self.assertEqual(result.get("nuevo_saldo"), 50)


class AiAssistantSecurityIsolationTestCase(TestCase):
    """
    Pruebas de aislamiento multi-tenant, control de acceso IDOR y
    validaciones defensivas para el asistente de IA y sus herramientas.
    """
    def setUp(self):
        from apps.institutions.models import Institution
        from apps.activities.models import Activity, Submission

        # Institución A
        self.inst_a = Institution.objects.create(nombre="Colegio San Pedro", codigo_dane="100001")
        self.rector_a = User.objects.create_user(
            username="rector_a", email="rector_a@edubid.co", password="password123",
            role="rector", institucion=self.inst_a
        )
        self.docente_a = User.objects.create_user(
            username="docente_a", email="docente_a@edubid.co", password="password123",
            role="docente", institucion=self.inst_a
        )
        self.estudiante_a = User.objects.create_user(
            username="estudiante_a", email="estudiante_a@edubid.co", password="password123",
            role="estudiante", institucion=self.inst_a
        )
        self.classroom_a = Classroom.objects.create(nombre="Matemáticas A", docente=self.docente_a)
        self.group_a = Group.objects.create(classroom=self.classroom_a, nombre="Grupo 10-A")
        self.group_a.estudiantes.add(self.estudiante_a)
        Period.crear_periodos_para_grupo(self.group_a)

        from django.utils import timezone
        from datetime import timedelta

        self.activity_a = Activity.objects.create(
            group=self.group_a, nombre="Taller Álgebra", valor_educoins=30,
            fecha_entrega=timezone.now() + timedelta(days=7)
        )
        self.submission_a = Submission.objects.create(
            activity=self.activity_a, estudiante=self.estudiante_a, contenido="Solución ejercicio 1"
        )

        # Institución B (Tenant separado)
        self.inst_b = Institution.objects.create(nombre="Colegio San Pablo", codigo_dane="200002")
        self.rector_b = User.objects.create_user(
            username="rector_b", email="rector_b@edubid.co", password="password123",
            role="rector", institucion=self.inst_b
        )
        self.docente_b = User.objects.create_user(
            username="docente_b", email="docente_b@edubid.co", password="password123",
            role="docente", institucion=self.inst_b
        )
        self.estudiante_b = User.objects.create_user(
            username="estudiante_b", email="estudiante_b@edubid.co", password="password123",
            role="estudiante", institucion=self.inst_b
        )
        self.classroom_b = Classroom.objects.create(nombre="Física B", docente=self.docente_b)
        self.group_b = Group.objects.create(classroom=self.classroom_b, nombre="Grupo 11-B")
        self.group_b.estudiantes.add(self.estudiante_b)
        Period.crear_periodos_para_grupo(self.group_b)

        self.activity_b = Activity.objects.create(
            group=self.group_b, nombre="Laboratorio Ondas", valor_educoins=40,
            fecha_entrega=timezone.now() + timedelta(days=7)
        )
        self.submission_b = Submission.objects.create(
            activity=self.activity_b, estudiante=self.estudiante_b, contenido="Informe laboratorio"
        )

    def test_cross_tenant_isolation_get_classroom_students(self):
        """Docente o Rector de Institución A no puede obtener estudiantes de Institución B vía IA."""
        res_docente = dispatch_tool("get_classroom_students", {"grupo_id": self.group_b.id}, self.docente_a)
        self.assertIn("error", res_docente)

        res_rector = dispatch_tool("get_classroom_students", {"grupo_id": self.group_b.id}, self.rector_a)
        self.assertIn("error", res_rector)

    def test_cross_tenant_isolation_get_activities(self):
        """Docente de Institución A consultando grupo_id de Institución B no recibe actividades."""
        res = dispatch_tool("get_activities", {"grupo_id": self.group_b.id}, self.docente_a)
        self.assertEqual(res.get("total_actividades", 0), 0)

    def test_cross_tenant_isolation_get_submissions_to_grade(self):
        """Docente A no puede ver entregas de una actividad perteneciente a Docente B."""
        res = dispatch_tool("get_submissions_to_grade", {"activity_id": self.activity_b.id}, self.docente_a)
        self.assertIn("error", res)
        self.assertIn("No tienes permiso", res["error"])

    def test_cross_tenant_grade_submission_forbidden(self):
        """Docente A no puede calificar una entrega de la clase de Docente B."""
        res = dispatch_tool(
            "grade_submission",
            {"submission_id": self.submission_b.id, "calificacion": 4.5, "retroalimentacion": "Bien"},
            self.docente_a
        )
        self.assertIn("error", res)
        self.assertIn("Solo el docente titular", res["error"])

    def test_grade_submission_bounds_validation(self):
        """Calificaciones fuera del rango 0.0 - 5.0 son rechazadas."""
        res_neg = dispatch_tool(
            "grade_submission",
            {"submission_id": self.submission_a.id, "calificacion": -1.0},
            self.docente_a
        )
        self.assertIn("error", res_neg)

        res_high = dispatch_tool(
            "grade_submission",
            {"submission_id": self.submission_a.id, "calificacion": 10.0},
            self.docente_a
        )
        self.assertIn("error", res_high)

    def test_award_educoins_role_and_tenant_security(self):
        """Validaciones de seguridad al otorgar EduCoins mediante IA."""
        # Estudiante no puede otorgar monedas
        res_est = dispatch_tool(
            "award_educoins",
            {"grupo_id": self.group_a.id, "estudiante_identificador": self.estudiante_a.email, "cantidad": 20},
            self.estudiante_a
        )
        self.assertIn("error", res_est)

        # Docente A no puede otorgar monedas a grupo de Docente B
        res_cross = dispatch_tool(
            "award_educoins",
            {"grupo_id": self.group_b.id, "estudiante_identificador": self.estudiante_b.email, "cantidad": 20},
            self.docente_a
        )
        self.assertIn("error", res_cross)

        # Cantidad superior a 500 rechazada
        res_limit = dispatch_tool(
            "award_educoins",
            {"grupo_id": self.group_a.id, "estudiante_identificador": self.estudiante_a.email, "cantidad": 9999},
            self.docente_a
        )
        self.assertIn("error", res_limit)

        # Estudiante no matriculado en el grupo rechazado
        res_not_enrolled = dispatch_tool(
            "award_educoins",
            {"grupo_id": self.group_a.id, "estudiante_identificador": self.estudiante_b.email, "cantidad": 20},
            self.docente_a
        )
        self.assertIn("error", res_not_enrolled)

    def test_institution_summary_forbidden_for_docentes_and_students(self):
        """Resumen institucional no está disponible para docentes ni estudiantes."""
        res_doc = dispatch_tool("get_institution_summary", {}, self.docente_a)
        self.assertIn("error", res_doc)

        res_est = dispatch_tool("get_institution_summary", {}, self.estudiante_a)
        self.assertIn("error", res_est)

        # Rector solo ve datos de su institución
        res_rec = dispatch_tool("get_institution_summary", {}, self.rector_a)
        self.assertEqual(res_rec.get("institucion"), "Colegio San Pedro")
        self.assertEqual(res_rec.get("total_docentes"), 1)
        self.assertEqual(res_rec.get("total_estudiantes"), 1)


