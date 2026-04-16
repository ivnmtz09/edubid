from django.contrib import admin
from .models import User, Profile
from .token_models import EmailVerificationToken, PasswordResetAttempt, LoginFailureTracker

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "username", "role", "is_active", "email_verified", "is_staff", "creado", "actualizado")
    search_fields = ("email", "username", "role")
    list_filter = ("role", "is_active", "email_verified", "is_staff")
    ordering = ("-creado",)
    readonly_fields = ("creado", "actualizado")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "telefono", "institucion", "creado", "actualizado")
    search_fields = ("user__email", "telefono", "institucion")
    ordering = ("-creado",)
    readonly_fields = ("creado", "actualizado")


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token_short", "created_at", "expires_at", "is_used", "is_valid_status")
    search_fields = ("user__email", "token")
    list_filter = ("is_used", "created_at")
    ordering = ("-created_at",)
    readonly_fields = ("token", "created_at", "expires_at")

    def token_short(self, obj):
        return f"{obj.token[:20]}..."
    token_short.short_description = "Token"

    def is_valid_status(self, obj):
        return "✅ Válido" if obj.is_valid() else "❌ Inválido"
    is_valid_status.short_description = "Estado"


@admin.register(PasswordResetAttempt)
class PasswordResetAttemptAdmin(admin.ModelAdmin):
    list_display = ("email", "ip_address", "created_at", "success")
    search_fields = ("email", "ip_address")
    list_filter = ("success", "created_at")
    ordering = ("-created_at",)
    readonly_fields = ("email", "ip_address", "created_at")


@admin.register(LoginFailureTracker)
class LoginFailureTrackerAdmin(admin.ModelAdmin):
    list_display = ("email", "ip_address", "attempt_time")
    search_fields = ("email", "ip_address")
    ordering = ("-attempt_time",)
    readonly_fields = ("email", "ip_address", "attempt_time")
    
    actions = ["clear_failures"]

    def clear_failures(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} fallos de login eliminados.")
    clear_failures.short_description = "Limpiar fallos seleccionados"