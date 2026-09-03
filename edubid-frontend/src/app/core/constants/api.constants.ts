import { environment } from '../../../environments/environment';

export const API_BASE = environment.apiUrl;

export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE}/users/register/`,
  LOGIN: `${API_BASE}/users/login/`,
  GOOGLE_LOGIN: `${API_BASE}/users/google/`,
  TOKEN_REFRESH: `${API_BASE}/users/token/refresh/`,
  VERIFY_EMAIL: (token: string) => `${API_BASE}/users/verify-email/${token}/`,
  RESEND_VERIFICATION: `${API_BASE}/users/resend-verification/`,
  PROFILE: `${API_BASE}/users/profile/`,
  PROFILE_UPDATE: `${API_BASE}/users/profile/update/`,
  DELETE_ACCOUNT: `${API_BASE}/users/delete-account/`,
  CHANGE_PASSWORD: `${API_BASE}/users/change-password/`,
  PASSWORD_RESET: `${API_BASE}/users/password-reset/`,
  PASSWORD_RESET_CONFIRM: (uidb64: string, token: string) =>
    `${API_BASE}/users/password-reset-confirm/${uidb64}/${token}/`,
  INSTITUTIONS_PUBLIC: `${API_BASE}/institutions/public/`,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  RECTOR: 'rector',
  COORDINATOR: 'coordinador',
  TEACHER: 'docente',
  STUDENT: 'estudiante',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'edubid-theme',
} as const;
