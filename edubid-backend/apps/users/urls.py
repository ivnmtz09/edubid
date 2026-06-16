from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Autenticación
    path('register/', views.api_register, name='register'),
    path('login/', views.api_login, name='login'),
    path('google/', views.GoogleLoginAPIView.as_view(), name='google-login'),
    
    # JWT Refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Verificación de email
    path('verify-email/<str:token>/', views.verify_email, name='verify-email'),
    path('resend-verification/', views.resend_verification_email, name='resend-verification'),
    
    # Perfil
    path('profile/', views.api_profile, name='profile'),
    path('profile/update/', views.api_update_profile, name='update-profile'),
    path('delete-account/', views.api_delete_account, name='delete-account'),
    
    # Contraseñas
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/<uidb64>/<token>/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Gestión de usuarios (admin)
    path('list/', views.api_list_users, name='list-users'),
    path('<int:user_id>/update/', views.api_update_user, name='update-user'),
    path('<int:user_id>/delete/', views.api_delete_user, name='delete-user'),
]