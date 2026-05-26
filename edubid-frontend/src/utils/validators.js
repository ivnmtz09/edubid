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
    errors.coin_limit = "El límite de edubids debe ser mayor a 0"
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
