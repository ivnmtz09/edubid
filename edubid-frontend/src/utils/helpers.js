export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return "0 COP"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Fecha inválida"
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export const formatDateTime = (dateString) => {
  if (!dateString) return "Fecha no disponible"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Fecha inválida"
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const formatCoins = (amount) => {
  if (amount == null || isNaN(amount)) return "0 Educoins"
  return `${amount.toLocaleString("es-CO")} Educoins`
}

// Específico para EC (Educoins) - Formato corto para la wallet
export const formatEC = (amount) => {
  if (amount == null || isNaN(amount)) return "0 EC"
  return `${amount.toLocaleString("es-CO")} EC`
}

// Formato compacto para números grandes
export const formatCompactEC = (amount) => {
  if (amount == null || isNaN(amount)) return "0 EC"
  
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M EC`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K EC`
  }
  
  return `${amount.toLocaleString("es-CO")} EC`
}

export const truncateText = (text, maxLength = 100) => {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
}

export const generateClassCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 8
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const formatRelativeTime = (dateString) => {
  if (!dateString) return "Fecha no disponible"
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Fecha inválida"
  
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins === 1) return 'Hace 1 minuto'
  if (diffMins < 60) return `Hace ${diffMins} minutos`
  if (diffHours === 1) return 'Hace 1 hora'
  if (diffHours < 24) return `Hace ${diffHours} horas`
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffWeeks === 1) return 'Hace 1 semana'
  if (diffWeeks < 4) return `Hace ${diffWeeks} semanas`
  if (diffMonths === 1) return 'Hace 1 mes'
  if (diffMonths < 12) return `Hace ${diffMonths} meses`
  
  return formatDate(dateString)
}

// Helper específico para transacciones de wallet - ACTUALIZADO
export const formatTransactionType = (tipo) => {
  const types = {
    'earn': 'Ingreso',
    'spend': 'Gasto', 
    'reset': 'Reinicio',
    'reward': 'Recompensa'
  }
  return types[tipo] || 'Transacción'
}

// Helper para obtener icono de transacción - ACTUALIZADO
export const getTransactionIcon = (tipo) => {
  const icons = {
    'earn': '💰',
    'spend': '💸',
    'reset': '🔄',
    'reward': '🎁'
  }
  return icons[tipo] || '💳'
}

// Helper para formatear descripción de transacción - ACTUALIZADO
export const formatTransactionDescription = (transaction) => {
  if (transaction.descripcion) {
    return transaction.descripcion
  }
  
  const defaultDescriptions = {
    'earn': 'Recompensa obtenida',
    'spend': 'Gasto realizado',
    'reset': 'Reinicio de periodo',
    'reward': 'Recompensa recibida'
  }
  
  return defaultDescriptions[transaction.tipo] || 'Transacción'
}

// Helper para calcular saldo disponible
export const calculateAvailableBalance = (saldo, bloqueado) => {
  const total = parseFloat(saldo) || 0
  const locked = parseFloat(bloqueado) || 0
  return Math.max(0, total - locked)
}

// Helper para validar montos de transacción
export const validateTransactionAmount = (amount) => {
  if (amount == null || isNaN(amount)) return false
  if (amount <= 0) return false
  if (amount > 1000000) return false // Límite máximo de 1 millón
  return true
}

// Helper para formatear período académico
export const formatAcademicPeriod = (periodo) => {
  if (!periodo) return "Período actual"
  
  const currentYear = new Date().getFullYear()
  const periods = {
    '1': `Primer Semestre ${currentYear}`,
    '2': `Segundo Semestre ${currentYear}`,
    '3': `Tercer Semestre ${currentYear}`,
    'annual': `Año Académico ${currentYear}`
  }
  
  return periods[periodo] || periodo
}

// Helper para agrupar transacciones por fecha
export const groupTransactionsByDate = (transactions) => {
  if (!transactions || !Array.isArray(transactions)) return {}
  
  return transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.fecha).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {})
}

// Helper para calcular estadísticas de transacciones - ACTUALIZADO
export const calculateTransactionStats = (transactions) => {
  if (!transactions || !Array.isArray(transactions)) {
    return {
      totalEarned: 0,
      totalSpent: 0,
      netBalance: 0,
      transactionCount: 0,
      earnCount: 0,
      spendCount: 0
    }
  }

  console.log("Calculando stats para transacciones:", transactions)

  // Backend solo tiene: earn, spend, reset
  const totalEarned = transactions
    .filter(t => t.tipo === 'earn')
    .reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)

  const totalSpent = transactions
    .filter(t => t.tipo === 'spend')
    .reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)

  return {
    totalEarned,
    totalSpent,
    netBalance: totalEarned - totalSpent,
    transactionCount: transactions.length,
    earnCount: transactions.filter(t => t.tipo === 'earn').length,
    spendCount: transactions.filter(t => t.tipo === 'spend').length
  }
}

export const validateLoginForm = (data) => {
  const errors = {}

  if (!data.email) {
    errors.email = "El email es requerido"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "El email no es válido"
  }

  if (!data.password) {
    errors.password = "La contraseña es requerida"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateRegisterForm = (data) => {
  const errors = {}

  if (!data.first_name) errors.first_name = "El nombre es requerido"
  if (!data.last_name) errors.last_name = "El apellido es requerido"

  if (!data.email) {
    errors.email = "El email es requerido"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "El email no es válido"
  }

  if (!data.password) {
    errors.password = "La contraseña es requerida"
  } else if (data.password.length < 6) {
    errors.password = "La contraseña debe tener al menos 6 caracteres"
  }

  if (!data.password_confirm) {
    errors.password_confirm = "Debes confirmar tu contraseña"
  } else if (data.password !== data.password_confirm) {
    errors.password_confirm = "Las contraseñas no coinciden"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateClassroomForm = (data) => {
  const errors = {}

  if (!data.name) {
    errors.name = "El nombre de la clase es requerido"
  }

  if (!data.description) {
    errors.description = "La descripción es requerida"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateActivityForm = (data) => {
  const errors = {}

  if (!data.title) {
    errors.title = "El título es requerido"
  }

  if (!data.description) {
    errors.description = "La descripción es requerida"
  }

  if (!data.reward_coins || data.reward_coins <= 0) {
    errors.reward_coins = "La recompensa debe ser mayor a 0"
  }

  if (!data.group) {
    errors.group = "Debe seleccionar un grupo"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateAuctionForm = (data) => {
  const errors = {}

  if (!data.title) {
    errors.title = "El título es requerido"
  }

  if (!data.description) {
    errors.description = "La descripción es requerida"
  }

  if (!data.starting_price || data.starting_price <= 0) {
    errors.starting_price = "El precio inicial debe ser mayor a 0"
  }

  if (!data.end_date) {
    errors.end_date = "La fecha de finalización es requerida"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateGroupForm = (data) => {
  const errors = {}

  if (!data.name) {
    errors.name = "El nombre del grupo es requerido"
  }

  if (!data.max_students || data.max_students <= 0) {
    errors.max_students = "El máximo de estudiantes debe ser mayor a 0"
  }

  if (!data.coin_limit || data.coin_limit <= 0) {
    errors.coin_limit = "El límite de educoins debe ser mayor a 0"
  }

  if (!data.start_date) {
    errors.start_date = "La fecha de inicio es requerida"
  }

  if (!data.end_date) {
    errors.end_date = "La fecha de fin es requerida"
  }

  if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
    errors.end_date = "La fecha de fin debe ser posterior a la fecha de inicio"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}