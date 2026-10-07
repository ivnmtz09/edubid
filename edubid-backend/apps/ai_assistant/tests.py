from django.test import TestCase
from apps.users.models import User
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.ai_assistant.tools import dispatch_tool


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

    def test_create_classroom(self):
        result = dispatch_tool("create_classroom", {"nombre": "Programación Web"}, self.docente)
        self.assertEqual(result.get("status"), "success")
        self.assertTrue(Classroom.objects.filter(nombre="Programación Web", docente=self.docente).exists())

    def test_create_group(self):
        classroom = Classroom.objects.create(nombre="Algoritmos", docente=self.docente)
        result = dispatch_tool("create_group", {"classroom_id": classroom.id, "nombre": "Grupo 1"}, self.docente)
        self.assertEqual(result.get("status"), "success")
        self.assertIn("codigo_acceso", result)
        self.assertTrue(Group.objects.filter(classroom=classroom, nombre="Grupo 1").exists())

    def test_create_classroom_with_groups(self):
        result = dispatch_tool(
            "create_classroom_with_groups",
            {
                "nombre_asignatura": "Desarrollo Móvil",
                "nombres_grupos": ["A1", "B1"]
            },
            self.docente
        )
        self.assertEqual(result.get("status"), "success")
        self.assertEqual(result.get("total_grupos_creados"), 2)

        classroom = Classroom.objects.get(nombre="Desarrollo Móvil", docente=self.docente)
        grupos = list(classroom.grupos_clases.all().order_by("nombre"))
        self.assertEqual(len(grupos), 2)
        self.assertEqual(grupos[0].nombre, "A1")
        self.assertEqual(grupos[1].nombre, "B1")
        self.assertTrue(bool(grupos[0].codigo))
        self.assertTrue(bool(grupos[1].codigo))

    def test_unauthorized_user_cannot_create_classroom(self):
        result = dispatch_tool("create_classroom", {"nombre": "Robótica"}, self.estudiante)
        self.assertIn("error", result)
        self.assertFalse(Classroom.objects.filter(nombre="Robótica").exists())

    def test_delete_classroom_and_group(self):
        classroom = Classroom.objects.create(nombre="Química", docente=self.docente)
        group = Group.objects.create(classroom=classroom, nombre="G1")

        del_group_result = dispatch_tool("delete_group", {"grupo_id": group.id}, self.docente)
        self.assertEqual(del_group_result.get("status"), "success")
        self.assertFalse(Group.objects.filter(id=group.id).exists())

        del_class_result = dispatch_tool("delete_classroom", {"classroom_id": classroom.id}, self.docente)
        self.assertEqual(del_class_result.get("status"), "success")
        self.assertFalse(Classroom.objects.filter(id=classroom.id).exists())
