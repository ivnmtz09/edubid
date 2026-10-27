from django.test import TestCase
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.conf import settings
from apps.users.models import User, Profile
from apps.users.token_models import EmailVerificationToken
from apps.institutions.models import Institution
from apps.users.permissions import IsDocente, AdminOrDocente
from rest_framework.test import APIClient


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


class AuthRateLimitingTests(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        from django.core.cache import cache
        cache.clear()

    def test_login_rate_limiting_exceeded(self):
        """
        Verifica que al superar la cuota máxima permitida (10 peticiones/minuto)
        en el endpoint de login (/api/users/login/), la API responda con HTTP 429 Too Many Requests.
        """
        for i in range(10):
            response = self.client.post(
                "/api/users/login/",
                {"email": "inexistente@edubid.com", "password": "wrongpassword"},
                format="json"
            )
            self.assertEqual(response.status_code, 400)

        # La 11va petición debe ser bloqueada por rate limiting (HTTP 429)
        throttled_response = self.client.post(
            "/api/users/login/",
            {"email": "inexistente@edubid.com", "password": "wrongpassword"},
            format="json"
        )
        self.assertEqual(throttled_response.status_code, 429)

    def test_rate_limit_not_bypassed_by_spoofed_forwarded_for(self):
        """Un cliente que inventa X-Forwarded-For no debe evadir el limite: cuenta la IP anadida por el proxy."""
        for i in range(10):
            response = self.client.post(
                "/api/users/login/",
                {"email": "inexistente@edubid.com", "password": "wrongpassword"},
                format="json",
                HTTP_X_FORWARDED_FOR=f"10.0.0.{i}, 203.0.113.9",
            )
            self.assertEqual(response.status_code, 400)
        blocked = self.client.post(
            "/api/users/login/",
            {"email": "inexistente@edubid.com", "password": "wrongpassword"},
            format="json",
            HTTP_X_FORWARDED_FOR="10.0.0.99, 203.0.113.9",
        )
        self.assertEqual(blocked.status_code, 429)

    def test_otp_blocked_after_too_many_failed_attempts(self):
        """Tras 5 codigos incorrectos se bloquea el correo, incluso con el codigo correcto."""
        user = User.objects.create_user(
            username="otp_brute", email="otp_brute@edubid.com", password="Password123!",
            is_active=False, email_verified=False
        )
        token = EmailVerificationToken.objects.create(user=user)
        wrong = "000000" if token.code != "000000" else "999999"
        for _ in range(5):
            res = self.client.post("/api/users/verify-email-code/",
                                   {"email": user.email, "code": wrong}, format="json",
                                   HTTP_X_FORWARDED_FOR=f"1.1.1.1, 198.51.100.{_}")
            self.assertEqual(res.status_code, 400)
        res = self.client.post("/api/users/verify-email-code/",
                               {"email": user.email, "code": token.code}, format="json",
                               HTTP_X_FORWARDED_FOR="1.1.1.1, 198.51.100.77")
        self.assertEqual(res.status_code, 429)
        user.refresh_from_db()
        self.assertFalse(user.email_verified)

    def test_password_reset_rate_limiting_exceeded(self):
        """
        Verifica que al superar la cuota permitida (5 peticiones/minuto) en
        /api/users/password-reset/, la API bloquee las peticiones con HTTP 429.
        """
        for i in range(5):
            response = self.client.post(
                "/api/users/password-reset/",
                {"email": "usuario@edubid.com"},
                format="json"
            )
            self.assertEqual(response.status_code, 200)

        # La 6ta petición debe retornar HTTP 429
        throttled_response = self.client.post(
            "/api/users/password-reset/",
            {"email": "usuario@edubid.com"},
            format="json"
        )
        self.assertEqual(throttled_response.status_code, 429)

    def test_update_profile_name_and_nested_profile(self):
        """Verifica que un usuario pueda actualizar su nombre sin espacios y sus campos de perfil anidados."""
        user = User.objects.create_user(
            username="docente_test",
            email="docente_test@edubid.com",
            password="password123",
            first_name="JUAN CARLOS",
            last_name="AÑEZ (:-)",
            role="docente"
        )
        self.client.force_authenticate(user=user)

        payload = {
            "first_name": "  JUAN CARLOS  ",
            "last_name": "  AÑEZ  ",
            "profile": {
                "telefono": "  3009998877  ",
                "direccion": "Calle 10 # 5-20",
                "bio": "Docente titular de informática"
            }
        }
        res = self.client.patch("/api/users/profile/update/", payload, format="json")
        self.assertEqual(res.status_code, 200)

        # Verificar respuesta JSON
        data = res.data["user"]
        self.assertEqual(data["first_name"], "JUAN CARLOS")
        self.assertEqual(data["last_name"], "AÑEZ")
        self.assertEqual(data["profile"]["telefono"], "3009998877")
        self.assertEqual(data["profile"]["bio"], "Docente titular de informática")

        # Verificar persistencia en base de datos
        user.refresh_from_db()
        self.assertEqual(user.first_name, "JUAN CARLOS")
        self.assertEqual(user.last_name, "AÑEZ")
        self.assertEqual(user.profile.telefono, "3009998877")
        self.assertEqual(user.profile.bio, "Docente titular de informática")


class UserManagementSecurityTestCase(TestCase):
    """
    Pruebas de seguridad, jerarquía de autorización y prevención de escalamiento de privilegios en api_update_user.
    """
    def setUp(self):
        self.client = APIClient()

        # Institución A
        self.inst_a = Institution.objects.create(nombre="Colegio Central", codigo_dane="9001")
        self.rector_a = User.objects.create_user(
            username="rector_ua", email="rector_ua@edubid.com", password="password123",
            role="rector", institucion=self.inst_a
        )
        self.coordinador_a = User.objects.create_user(
            username="coord_ua", email="coord_ua@edubid.com", password="password123",
            role="coordinador", institucion=self.inst_a
        )
        self.docente_a = User.objects.create_user(
            username="docente_ua", email="docente_ua@edubid.com", password="password123",
            role="docente", institucion=self.inst_a
        )

        # Institución B
        self.inst_b = Institution.objects.create(nombre="Colegio Norte", codigo_dane="9002")
        self.docente_b = User.objects.create_user(
            username="docente_ub", email="docente_ub@edubid.com", password="password123",
            role="docente", institucion=self.inst_b
        )

    def test_coordinator_cannot_modify_rector(self):
        """Un coordinador no tiene permiso para modificar o desactivar al rector."""
        self.client.force_authenticate(user=self.coordinador_a)
        res = self.client.patch(
            f"/api/users/{self.rector_a.id}/update/",
            {"first_name": "Rector Hackeado", "is_active": False},
            format="json"
        )
        self.assertEqual(res.status_code, 403)

    def test_coordinator_cannot_promote_to_rector_or_admin(self):
        """Un coordinador no puede promover a ningún usuario a rector o admin."""
        self.client.force_authenticate(user=self.coordinador_a)
        res_admin = self.client.patch(
            f"/api/users/{self.docente_a.id}/update/",
            {"role": "admin"},
            format="json"
        )
        self.assertEqual(res_admin.status_code, 403)

        res_rector = self.client.patch(
            f"/api/users/{self.docente_a.id}/update/",
            {"role": "rector"},
            format="json"
        )
        self.assertEqual(res_rector.status_code, 403)

    def test_coordinator_cannot_modify_user_of_another_school(self):
        """Un coordinador no puede modificar a usuarios de otra institución."""
        self.client.force_authenticate(user=self.coordinador_a)
        res = self.client.patch(
            f"/api/users/{self.docente_b.id}/update/",
            {"first_name": "Ataque Cross Tenant"},
            format="json"
        )
        self.assertEqual(res.status_code, 403)

    def test_rector_cannot_promote_to_admin(self):
        """Un rector institucional no puede asignar el rol de administrador global."""
        self.client.force_authenticate(user=self.rector_a)
        res = self.client.patch(
            f"/api/users/{self.docente_a.id}/update/",
            {"role": "admin"},
            format="json"
        )
        self.assertEqual(res.status_code, 403)

    def test_coordinator_cannot_escalate_self_role(self):
        """Un directivo o coordinador no puede cambiar su propio rol."""
        self.client.force_authenticate(user=self.coordinador_a)
        res = self.client.patch(
            f"/api/users/{self.coordinador_a.id}/update/",
            {"role": "rector"},
            format="json"
        )
        self.assertEqual(res.status_code, 403)


class InstitutionalIsolationAndRegistrationTests(TestCase):
    """
    Pruebas de aislamiento multi-inquilino institucional y registro por slug dedicado.
    """
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.institucion_a = Institution.objects.create(
            nombre="Colegio San José A",
            codigo_dane="111110",
            activo=True
        )
        self.institucion_b = Institution.objects.create(
            nombre="Colegio Mayor B",
            codigo_dane="222220",
            activo=True
        )
        self.admin = User.objects.create_user(
            username="admin_global_test",
            email="admin_global_test@edubid.com",
            password="password123",
            role="admin",
            email_verified=True
        )
        self.docente_a = User.objects.create_user(
            username="docente_a_test",
            email="docente_a_test@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_a,
            email_verified=True
        )

    def tearDown(self):
        cache.clear()

    def test_login_institutional_isolation_rejection(self):
        """Un usuario de la Institución A no puede iniciar sesión en el portal de la Institución B."""
        payload = {
            "email": self.docente_a.email,
            "password": "password123",
            "institution_slug": self.institucion_b.slug
        }
        res = self.client.post("/api/users/login/", payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("no pertenece a esta institución", str(res.data))

    def test_login_institutional_isolation_success(self):
        """Un usuario de la Institución A inicia sesión exitosamente en su portal institucional."""
        payload = {
            "email": self.docente_a.email,
            "password": "password123",
            "institution_slug": self.institucion_a.slug
        }
        res = self.client.post("/api/users/login/", payload, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("tokens", res.data)

    def test_login_institutional_admin_bypass(self):
        """El administrador global puede iniciar sesión en cualquier portal institucional."""
        payload = {
            "email": self.admin.email,
            "password": "password123",
            "institution_slug": self.institucion_a.slug
        }
        res = self.client.post("/api/users/login/", payload, format="json")
        self.assertEqual(res.status_code, 200)

    def test_register_student_with_institution_slug(self):
        """El registro con institution_slug asocia la institución y rol de estudiante automáticamente."""
        payload = {
            "email": "nuevo_alumno@edubid.com",
            "first_name": "Carlos",
            "last_name": "Pérez",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "role": "estudiante",
            "institution_slug": self.institucion_a.slug
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        user = User.objects.get(email="nuevo_alumno@edubid.com")
        self.assertEqual(user.institucion, self.institucion_a)
        self.assertEqual(user.role, "estudiante")

    def test_register_teacher_with_institution_slug(self):
        """El registro extraordinario de docente asocia la institución y rol docente."""
        payload = {
            "email": "nuevo_profe@edubid.com",
            "first_name": "Laura",
            "last_name": "Gómez",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "role": "docente",
            "institution_slug": self.institucion_b.slug
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        user = User.objects.get(email="nuevo_profe@edubid.com")
        self.assertEqual(user.institucion, self.institucion_b)
        self.assertEqual(user.role, "docente")

    def test_six_digit_otp_generation_and_auto_login(self):
        """Verifica generación de código de 6 dígitos, vigencia de 1 hora y login automático tras validación."""
        payload = {
            "email": "estudiante_otp@edubid.com",
            "first_name": "Mateo",
            "last_name": "Rojas",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "role": "estudiante",
            "institution_slug": self.institucion_a.slug
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data.get("verification_required"))

        user = User.objects.get(email="estudiante_otp@edubid.com")
        self.assertFalse(user.is_active)
        self.assertFalse(user.email_verified)

        token = EmailVerificationToken.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(token)
        self.assertIsNotNone(token.code)
        self.assertEqual(len(token.code), 6)
        self.assertTrue(token.code.isdigit())
        # Vigencia aproximada de 1 hora
        time_diff = token.expires_at - token.created_at
        self.assertAlmostEqual(time_diff.total_seconds(), 3600, delta=10)

        # Validación con código correcto
        verify_res = self.client.post("/api/users/verify-email-code/", {
            "email": user.email,
            "code": token.code
        }, format="json")

        self.assertEqual(verify_res.status_code, 200)
        self.assertIn("tokens", verify_res.data)
        self.assertIn("access", verify_res.data["tokens"])
        self.assertIn("refresh", verify_res.data["tokens"])
        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
        token.refresh_from_db()
        self.assertTrue(token.is_used)

    def test_verify_email_code_invalid_and_expired(self):
        """Verifica rechazo con código inválido y expirado."""
        user = User.objects.create_user(
            username="test_otp_invalido",
            email="test_otp_invalido@edubid.com",
            password="Password123!",
            is_active=False,
            email_verified=False
        )
        token = EmailVerificationToken.objects.create(user=user)

        # Código incorrecto
        bad_res = self.client.post("/api/users/verify-email-code/", {
            "email": user.email,
            "code": "000000" if token.code != "000000" else "999999"
        }, format="json")
        self.assertEqual(bad_res.status_code, 400)

        # Código expirado
        from django.utils import timezone
        from datetime import timedelta
        token.expires_at = timezone.now() - timedelta(minutes=5)
        token.save()

        exp_res = self.client.post("/api/users/verify-email-code/", {
            "email": user.email,
            "code": token.code
        }, format="json")
        self.assertEqual(exp_res.status_code, 400)
        self.assertIn("expirado", str(exp_res.data).lower())

    def test_verify_email_code_already_verified_does_not_issue_tokens(self):
        """Una cuenta ya verificada no debe entregar sesión JWT solo con su correo y un código cualquiera."""
        user = User.objects.create_user(
            username="ya_verificado",
            email="ya_verificado@edubid.com",
            password="Password123!",
            is_active=True,
            email_verified=True
        )
        res = self.client.post("/api/users/verify-email-code/", {
            "email": user.email,
            "code": "123456"
        }, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertNotIn("tokens", res.data)
        self.assertTrue(res.data.get("already_verified"))

    def test_register_rector_success_and_duplicate_blocked(self):
        """El registro exclusivo de rector se asigna correctamente y bloquea duplicados en la misma institución."""
        payload = {
            "email": "rector_colegio_a@edubid.com",
            "first_name": "Ramiro",
            "last_name": "Suárez",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "role": "rector",
            "institution_slug": self.institucion_a.slug
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        rector = User.objects.get(email="rector_colegio_a@edubid.com")
        self.assertEqual(rector.role, "rector")
        self.assertEqual(rector.institucion, self.institucion_a)

        # Intentar registrar un segundo rector en la misma institución A
        payload2 = {
            "email": "segundo_rector@edubid.com",
            "first_name": "Pedro",
            "last_name": "Martínez",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "role": "rector",
            "institution_slug": self.institucion_a.slug
        }
        res2 = self.client.post("/api/users/register/", payload2, format="json")
        self.assertEqual(res2.status_code, 400)
        self.assertIn("rector asignado", str(res2.data).lower())

    def test_register_coordinator_with_institution_slug(self):
        """Registro de coordinador escolar vinculado a la institución."""
        payload = {
            "email": "coordinador_colegio_b@edubid.com",
            "first_name": "Beatriz",
            "last_name": "Mendoza",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "role": "coordinador",
            "institution_slug": self.institucion_b.slug
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        coord = User.objects.get(email="coordinador_colegio_b@edubid.com")
        self.assertEqual(coord.role, "coordinador")
        self.assertEqual(coord.institucion, self.institucion_b)

    def test_register_role_without_institution_blocked(self):
        """Roles rector, coordinador y docente no pueden registrarse sin institución."""
        for r in ["rector", "coordinador", "docente"]:
            payload = {
                "email": f"sin_colegio_{r}@edubid.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "Password123!",
                "password_confirm": "Password123!",
                "role": r
            }
            res = self.client.post("/api/users/register/", payload, format="json")
            self.assertEqual(res.status_code, 400)
            self.assertIn("requiere el enlace exclusivo", str(res.data).lower())





class PrivilegedRoleApprovalTests(TestCase):
    """docente/coordinador/rector no se activan solos: el slug de la institucion es publico."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.inst = Institution.objects.create(nombre="Colegio Aprob", codigo_dane="313131", activo=True)
        self.admin = User.objects.create_user(username="ap_admin", email="ap_admin@edubid.com", password="password123",
                                              role="admin", email_verified=True)

    def _register(self, email, role):
        res = self.client.post("/api/users/register/", {
            "email": email, "first_name": "N", "last_name": "A", "password": "Password123!",
            "password_confirm": "Password123!", "role": role, "institution_slug": self.inst.slug}, format="json",
            HTTP_X_FORWARDED_FOR=f"1.1.1.1, 10.1.1.{abs(hash(email)) % 200}")
        self.assertEqual(res.status_code, 201, res.data)
        return User.objects.get(email=email)

    def _verify(self, user):
        code = EmailVerificationToken.objects.filter(user=user, is_used=False).first().code
        return self.client.post("/api/users/verify-email-code/", {"email": user.email, "code": code}, format="json")

    def test_teacher_registered_with_public_slug_stays_pending_until_approved(self):
        user = self._register("pend_doc@edubid.com", "docente")
        res = self._verify(user)
        self.assertEqual(res.status_code, 409)
        self.assertTrue(res.data["pending_approval"])
        self.assertNotIn("tokens", res.data)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)
        self.assertFalse(user.is_active)

        login = self.client.post("/api/users/login/", {"email": user.email, "password": "Password123!"}, format="json")
        self.assertEqual(login.status_code, 409)
        self.assertTrue(login.data["pending_approval"])
        wrong = self.client.post("/api/users/login/", {"email": user.email, "password": "otra"}, format="json")
        self.assertEqual(wrong.status_code, 400)       # sin pista si la contrasena es incorrecta

        # Un admin la aprueba con la gestion de usuarios existente y ya puede entrar
        self.client.force_authenticate(user=self.admin)
        ok = self.client.patch(f"/api/users/{user.id}/update/", {"is_active": True}, format="json")
        self.assertEqual(ok.status_code, 200, ok.data)
        self.client.force_authenticate(user=None)
        login = self.client.post("/api/users/login/", {"email": user.email, "password": "Password123!"}, format="json")
        self.assertEqual(login.status_code, 200)

    def test_rector_registration_also_pending(self):
        user = self._register("pend_rec@edubid.com", "rector")
        self.assertEqual(self._verify(user).status_code, 409)
        user.refresh_from_db()
        self.assertFalse(user.is_active)

    def test_student_registration_is_unchanged(self):
        user = self._register("est_ok@edubid.com", "estudiante")
        res = self._verify(user)
        self.assertEqual(res.status_code, 200)
        self.assertIn("tokens", res.data)
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_approval_can_be_disabled_by_setting(self):
        from django.test import override_settings
        with override_settings(REQUIRE_PRIVILEGED_APPROVAL=False):
            user = self._register("auto_doc@edubid.com", "docente")
            self.assertEqual(self._verify(user).status_code, 200)

    def test_google_login_rejects_deactivated_users_and_new_teachers(self):
        from unittest import mock
        gone = User.objects.create_user(username="g_off", email="g_off@edubid.com", password="x", role="estudiante",
                                        is_active=False, email_verified=True)
        info = lambda mail: {"email": mail, "email_verified": True, "given_name": "G", "family_name": "U",
                             "aud": settings.GOOGLE_CLIENT_ID}
        with mock.patch("google.oauth2.id_token.verify_oauth2_token", return_value=info(gone.email)):
            res = self.client.post("/api/users/google/", {"id_token": "t"}, format="json")
            self.assertEqual(res.status_code, 409)
        with mock.patch("google.oauth2.id_token.verify_oauth2_token", return_value=info("nuevo_doc@edubid.com")):
            res = self.client.post("/api/users/google/", {"id_token": "t", "role": "docente"}, format="json")
            self.assertEqual(res.status_code, 400)
            self.assertFalse(User.objects.filter(email="nuevo_doc@edubid.com").exists())
            res = self.client.post("/api/users/google/", {"id_token": "t", "role": "estudiante"}, format="json")
            self.assertEqual(res.status_code, 200)
