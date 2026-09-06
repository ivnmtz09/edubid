export interface UserInstitution {
  id: number;
  nombre: string;
  color_primario: string;
  color_secundario: string;
  logo: string | null;
}

export interface UserProfile {
  bio: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  institucion: UserInstitution | null;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar: string | null;
  date_joined: string;
  is_active?: boolean;
  profile: UserProfile;
}

export type UserRole = 'admin' | 'rector' | 'coordinador' | 'docente' | 'estudiante';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  institucion_id?: number | null;
  institution?: number | null;
  role: UserRole;
  password: string;
  password_confirm: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  verification_required: boolean;
  user_id: number;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface EmailVerificationResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
}

export interface PublicInstitution {
  id: number;
  nombre: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  new_password: string;
  confirm_password: string;
}
