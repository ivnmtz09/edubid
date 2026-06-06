export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  // ==================== AUTH ====================
  LOGIN: "/api/users/login/",
  REGISTER: "/api/users/register/",
  PROFILE: "/api/users/profile/",
  PROFILE_UPDATE: "/api/users/profile/update/",
  GOOGLE_LOGIN: "/api/users/google/",

  // Verificación de email
  VERIFY_EMAIL: (token) => `/api/users/verify-email/${token}/`,
  RESEND_VERIFICATION: "/api/users/resend-verification/",

  // Contraseñas
  CHANGE_PASSWORD: "/api/users/change-password/",
  PASSWORD_RESET: "/api/users/password-reset/",
  PASSWORD_RESET_CONFIRM: (uidb64, token) =>
    `/api/users/password-reset-confirm/${uidb64}/${token}/`,

  // Cuenta
  DELETE_ACCOUNT: "/api/users/delete-account/",

  // Admin
  USER_LIST: "/api/users/list/",
  USER_UPDATE: (id) => `/api/users/${id}/update/`,
  USER_DELETE: (id) => `/api/users/${id}/delete/`,

  // ==================== CLASSROOMS ====================
  CLASSROOMS: "/api/classrooms/",
  CLASSROOM_DETAIL: (id) => `/api/classrooms/${id}/`,
  CLASSROOM_STUDENTS: (id) => `/api/classrooms/${id}/students/`,

  // ==================== GROUPS ====================
  GROUPS: "/api/groups/",
  GROUP_DETAIL: (id) => `/api/groups/${id}/`,
  GROUP_JOIN_BY_CODE: "/api/groups/join/",
  GROUP_JOIN_BY_ID: (id) => `/api/groups/${id}/join/`,

  // ==================== ACTIVITIES ====================
  ACTIVITIES: "/api/activities/",
  ACTIVITY_DETAIL: (id) => `/api/activities/${id}/`,

  // ==================== SUBMISSIONS ====================
  SUBMISSIONS: "/api/submissions/",
  SUBMISSION_DETAIL: (id) => `/api/submissions/${id}/`,
  SUBMISSION_GRADE: (id) => `/api/submissions/${id}/grade/`,

  // ==================== GRADES ====================
  GRADES: "/api/grades/",
  GRADE_DETAIL: (id) => `/api/grades/${id}/`,
  MY_GRADES: "/api/grades/mis-notas/",
  GROUP_REPORT: (groupId) => `/api/grades/grupo/${groupId}/reporte/`,
  GRADE_MULTIPLE: "/api/grades/calificar-multiple/",

  // ==================== TOKENS/WALLET ====================
  MY_WALLET: "/api/tokens/wallets/mi_wallet/",
  WALLETS: "/api/tokens/wallets/",
  WALLET_DETAIL: (id) => `/api/tokens/wallets/${id}/`,
  WALLET_DEPOSIT: (id) => `/api/tokens/wallets/${id}/depositar/`,

  TRANSACTIONS: "/api/tokens/transactions/",
  TRANSACTION_DETAIL: (id) => `/api/tokens/transactions/${id}/`,

  PERIODS: "/api/tokens/periods/",
  PERIOD_DETAIL: (id) => `/api/tokens/periods/${id}/`,
  PERIOD_ACTIVATE: (id) => `/api/tokens/periods/${id}/activar/`,
  MY_PERIODS: "/api/tokens/periods/mis_periodos/",

  // ==================== AUCTIONS ====================
  AUCTIONS: "/api/auctions/auctions/",
  AUCTION_DETAIL: (id) => `/api/auctions/auctions/${id}/`,
  AUCTION_CLOSE: (id) => `/api/auctions/auctions/${id}/close/`,

  // Bids - usar /api/bids/
  BIDS: "/api/auctions/bids/",
  BID_DETAIL: (id) => `/api/auctions/bids/${id}/`,
  AUCTION_BIDS: (auctionId) => `/api/auctions/bids/por-subasta/${auctionId}/`,

  // ==================== NOTIFICATIONS ====================
  NOTIFICATIONS: "/api/notifications/",
  NOTIFICATION_DETAIL: (id) => `/api/notifications/${id}/`,
  NOTIFICATIONS_UNREAD: "/api/notifications/no-leidas/",
  NOTIFICATION_MARK_READ: (id) => `/api/notifications/${id}/marcar-leida/`,
  NOTIFICATIONS_MARK_ALL_READ: "/api/notifications/marcar-todas-leidas/",
  NOTIFICATIONS_DELETE_ALL: "/api/notifications/eliminar-todas/",
  NOTIFICATIONS_STATS: "/api/notifications/estadisticas/",
};

// ==================== USER ROLES ====================
export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "docente",
  STUDENT: "estudiante",
};

// ==================== ACTIVITY TYPES ====================
export const ACTIVITY_TYPES = {
  TAREA: "tarea",
  EXAMEN: "examen",
  PROYECTO: "proyecto",
  QUIZ: "quiz",
  EXPOSICION: "exposicion",
};

// ==================== TRANSACTION TYPES ====================
export const TRANSACTION_TYPES = {
  EARNED: "earn", // ✅ Según el backend
  SPENT: "spend", // ✅ Según el backend
  RESET: "reset", // ✅ Según el backend
};

// ==================== AUCTION STATUS ====================
export const AUCTION_STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
};

// ==================== NOTIFICATION TYPES ====================
export const NOTIFICATION_TYPES = {
  ACTIVITY: "actividad",
  GRADE: "calificacion",
  COINS: "monedas",
  AUCTION_NEW: "subasta_nueva",
  AUCTION_WON: "subasta_ganada",
  ANNOUNCEMENT: "anuncio",
  GENERAL: "general",
};

// ==================== THEME COLORS ====================
export const THEME = {
  PRIMARY: "#f97316", // Orange-500
  PRIMARY_DARK: "#ea580c", // Orange-600
  SECONDARY: "#3b82f6", // Blue-500
  BACKGROUND: "#f9fafb", // Gray-50
  CARD: "#ffffff",
  TEXT: "#111827", // Gray-900
  MUTED: "#6b7280", // Gray-500
};

// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
};

// ==================== PAGINATION ====================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};
