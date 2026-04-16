import api from "./api";
import { API_ENDPOINTS } from "../utils/constants";

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
      const { tokens, user } = response.data;

      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));

      return { user, tokens };
    } catch (error) {
      const errorData = error.response?.data || {};
      
      // Si sugiere reset de contraseña
      if (errorData.suggest_password_reset) {
        throw {
          message: errorData.message || "Credenciales incorrectas",
          suggestReset: true,
          email: credentials.email
        };
      }
      
      // Si email no verificado
      if (errorData.email_not_verified) {
        throw {
          message: "Por favor verifica tu correo electrónico",
          emailNotVerified: true,
          email: errorData.email
        };
      }
      
      throw new Error(
        errorData.message || 
        errorData.errors?.email?.[0] || 
        errorData.errors?.password?.[0] || 
        "Error al iniciar sesión"
      );
    }
  },

  async register(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.email?.[0] ||
        error.response?.data?.errors?.password?.[0] ||
        error.response?.data?.errors?.password_confirm?.[0] ||
        "Error al registrar usuario";
      throw new Error(errorMessage);
    }
  },

  async verifyEmail(token) {
    try {
      const response = await api.get(API_ENDPOINTS.VERIFY_EMAIL(token));
      const { user, tokens } = response.data;

      // Guardar tokens
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al verificar email");
    }
  },

  async resendVerificationEmail(email) {
    try {
      const response = await api.post(API_ENDPOINTS.RESEND_VERIFICATION, { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al reenviar email");
    }
  },

  async requestPasswordReset(email) {
    try {
      const response = await api.post(API_ENDPOINTS.PASSWORD_RESET, { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al solicitar restablecimiento");
    }
  },

  async confirmPasswordReset(uidb64, token, newPassword) {
    try {
      const response = await api.post(
        API_ENDPOINTS.PASSWORD_RESET_CONFIRM(uidb64, token),
        { new_password: newPassword }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al restablecer contraseña");
    }
  },

  async changePassword(oldPassword, newPassword, confirmPassword) {
    try {
      const response = await api.patch(API_ENDPOINTS.CHANGE_PASSWORD, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return response.data;
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      const errors = error.response?.data?.errors;
      
      if (errors) {
        // Manejar errores de validación del serializer
        const errorMessages = [];
        if (errors.old_password) errorMessages.push(errors.old_password[0]);
        if (errors.new_password) errorMessages.push(errors.new_password[0]);
        if (errors.confirm_password) errorMessages.push(errors.confirm_password[0]);
        if (errors.non_field_errors) errorMessages.push(errors.non_field_errors[0]);
        
        throw new Error(errorMessages.join(', ') || 'Error al cambiar contraseña');
      }
      
      throw new Error(errorDetail || 'Error al cambiar contraseña');
    }
  },

  async deleteAccount(password) {
    try {
      const response = await api.delete(API_ENDPOINTS.DELETE_ACCOUNT, {
        data: { password }
      });
      
      // Limpiar todo
      this.logout();
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al eliminar cuenta");
    }
  },

  async getProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al obtener perfil");
    }
  },

  async updateProfile(data) {
    const response = await api.patch("/api/users/profile/update/", data);
    return response.data;
  },
  
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem("access_token", access);
      return access;
    } catch (error) {
      this.logout();
      throw new Error("Sesión expirada, vuelve a iniciar sesión");
    }
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },

  getAccessToken() {
    return localStorage.getItem("access_token");
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};