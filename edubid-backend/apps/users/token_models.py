from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import secrets


class EmailVerificationToken(models.Model):
    """Token para verificación de email"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_verification_tokens'
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Token de Verificación de Email'
        verbose_name_plural = 'Tokens de Verificación de Email'

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def is_valid(self):
        """Verifica si el token es válido"""
        return not self.is_used and timezone.now() < self.expires_at

    def mark_as_used(self):
        """Marca el token como usado"""
        self.is_used = True
        self.save()

    def __str__(self):
        return f"Token para {self.user.email} - {'Usado' if self.is_used else 'Activo'}"


class PasswordResetAttempt(models.Model):
    """Registro de intentos de restablecimiento de contraseña"""
    email = models.EmailField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Intento de Restablecimiento'
        verbose_name_plural = 'Intentos de Restablecimiento'

    def __str__(self):
        return f"{self.email} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class LoginFailureTracker(models.Model):
    """Rastrea fallos de login para sugerir reset de contraseña"""
    email = models.EmailField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    attempt_time = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-attempt_time']
        verbose_name = 'Fallo de Login'
        verbose_name_plural = 'Fallos de Login'

    @classmethod
    def should_suggest_reset(cls, email):
        """
        Sugiere reset si hay 3+ fallos en las últimas 24 horas
        """
        last_24h = timezone.now() - timedelta(hours=24)
        recent_failures = cls.objects.filter(
            email=email,
            attempt_time__gte=last_24h
        ).count()
        return recent_failures >= 3

    @classmethod
    def clear_failures(cls, email):
        """Limpia los fallos después de login exitoso"""
        cls.objects.filter(email=email).delete()

    def __str__(self):
        return f"{self.email} - {self.attempt_time.strftime('%Y-%m-%d %H:%M')}"