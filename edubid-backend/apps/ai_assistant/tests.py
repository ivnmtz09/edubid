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

