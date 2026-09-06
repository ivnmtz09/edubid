from django.test import TestCase
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from apps.users.models import User, Profile
from apps.institutions.models import Institution
from apps.users.permissions import IsDocente, AdminOrDocente


class UserModelTests(TestCase):
    def setUp(self):
        self.institucion_a = Institution.objects.create(
            nombre="Colegio San José",
            codigo_dane="11111"
        )
        self.institucion_b = Institution.objects.create(
            nombre="Colegio Mayor",
            codigo_dane="22222"
        )

    def test_superadmin_no_institution_enforced(self):
        """Un SuperAdmin (admin) nunca puede tener una institución asignada."""
        admin = User.objects.create_user(
            username="superadmin",
            email="admin@edubid.com",
            password="password123",
            role="admin",
            institucion=self.institucion_a
        )
        # El método save() debe forzar institucion = None
        admin.refresh_from_db()
        self.assertIsNone(admin.institucion)

        # Si se intenta validar con institucion_id asignado, clean() debe lanzar ValidationError
        admin.institucion = self.institucion_a
        with self.assertRaises(ValidationError):
            admin.clean()

    def test_unique_rector_per_institution(self):
        """Solo puede existir un único rector activo por cada institución."""
        rector_1 = User.objects.create_user(
            username="rector1",
            email="rector1@edubid.com",
            password="password123",
            role="rector",
            institucion=self.institucion_a
        )
        self.assertEqual(rector_1.institucion, self.institucion_a)

        # Intentar crear un segundo rector en la misma institución A debe fallar por UniqueConstraint
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                User.objects.create_user(
                    username="rector2",
                    email="rector2@edubid.com",
                    password="password123",
                    role="rector",
                    institucion=self.institucion_a
                )

        # Crear un rector en una institución diferente B debe tener éxito
        rector_b = User.objects.create_user(
            username="rector_b",
            email="rector_b@edubid.com",
            password="password123",
            role="rector",
            institucion=self.institucion_b
        )
        self.assertEqual(rector_b.institucion, self.institucion_b)

    def test_multiple_docentes_allowed_per_institution(self):
        """Una institución puede tener múltiples docentes sin restricciones de unicidad."""
        docente_1 = User.objects.create_user(
            username="docente1",
            email="docente1@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_a
        )
        docente_2 = User.objects.create_user(
            username="docente2",
            email="docente2@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_a
        )
        self.assertEqual(docente_1.institucion, docente_2.institucion)

    def test_user_roles_valid(self):
        """Todos los roles definidos en ROLE_CHOICES deben ser asignables."""
        roles = ['admin', 'rector', 'coordinador', 'docente', 'estudiante']
        for role in roles:
            user = User.objects.create_user(
                username=f"user_{role}",
                email=f"{role}@edubid.com",
                password="password123",
                role=role,
                institucion=self.institucion_a if role != 'admin' else None
            )
            self.assertEqual(user.role, role)

    def test_profile_creation_and_fields(self):
        """El modelo Profile se auto-crea vía signal al crear el usuario y extiende sus campos."""
        estudiante = User.objects.create_user(
            username="estudiante_perfil",
            email="perfil@edubid.com",
            password="password123",
            role="estudiante"
        )
        # El signal de User ya creó el profile
        profile = estudiante.profile
        self.assertIsNotNone(profile)
        profile.bio = "Estudiante apasionado por la programación"
        profile.telefono = "3001234567"
        profile.direccion = "Calle 10 # 20-30"
        profile.save()

        self.assertEqual(profile.user, estudiante)
        self.assertEqual(str(profile), f"Perfil de {estudiante.email}")


class UserPermissionsTests(TestCase):
    def setUp(self):
        self.docente = User.objects.create_user(
            username="docente_perm",
            email="docente_perm@edubid.com",
            password="password123",
            role="docente"
        )
        self.estudiante = User.objects.create_user(
            username="estudiante_perm",
            email="estudiante_perm@edubid.com",
            password="password123",
            role="estudiante"
        )
        self.admin = User.objects.create_user(
            username="admin_perm",
            email="admin_perm@edubid.com",
            password="password123",
            role="admin"
        )

    def test_is_docente_permission(self):
        perm = IsDocente()

        class MockRequest:
            def __init__(self, user):
                self.user = user

        self.assertTrue(perm.has_permission(MockRequest(self.docente), None))
        self.assertFalse(perm.has_permission(MockRequest(self.estudiante), None))

    def test_admin_or_docente_permission(self):
        perm = AdminOrDocente()

        class MockRequest:
            def __init__(self, user):
                self.user = user

        self.assertTrue(perm.has_permission(MockRequest(self.docente), None))
        self.assertTrue(perm.has_permission(MockRequest(self.admin), None))
        self.assertFalse(perm.has_permission(MockRequest(self.estudiante), None))
