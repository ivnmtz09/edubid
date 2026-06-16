"use client"

import { createContext, useContext, useReducer, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import { API_ENDPOINTS, USER_ROLES } from "../utils/constants"
import { injectBrandColors } from "./ThemeContext"

const AuthContext = createContext()

const sanitizeUser = (user) => {
  if (!user) return null
  const { password, password_hash, last_login, is_superuser, is_staff, ...safeUser } = user
  return safeUser
}

const loadStoredUser = () => {
  try {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const initialState = {
  user: sanitizeUser(loadStoredUser()),
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_USER":
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null }
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false }
    case "LOGOUT":
      return { ...initialState, user: null, isAuthenticated: false }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const storedUser = loadStoredUser()
      if (storedUser && (storedUser.password || storedUser.password_hash)) {
        const cleanUser = sanitizeUser(storedUser)
        localStorage.setItem("user", JSON.stringify(cleanUser))
      }
    } catch (e) { /* ignorar */ }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token")
      if (!token) return
      try {
        dispatch({ type: "SET_LOADING", payload: true })
        const response = await api.get(API_ENDPOINTS.PROFILE)
        const raw = response.data.user || response.data
        const user = sanitizeUser(raw)
        localStorage.setItem("user", JSON.stringify(user))
        dispatch({ type: "SET_USER", payload: user })
      } catch (err) {
        console.error("Error cargando perfil:", err)
        handleLogout()
      }
    }
    loadProfile()
  }, [])

  const normalizeRole = (role) => {
    if (!role) return null
    const lower = role.toString().toLowerCase()
    if (lower.includes("admin")) return USER_ROLES.ADMIN
    if (lower.includes("rector")) return USER_ROLES.RECTOR
    if (lower.includes("coordinador") || lower.includes("coordinator")) return USER_ROLES.COORDINATOR
    if (lower.includes("teacher") || lower.includes("docente")) return USER_ROLES.TEACHER
    if (lower.includes("student") || lower.includes("estudiante")) return USER_ROLES.STUDENT
    return null
  }

  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const res = await api.post(API_ENDPOINTS.LOGIN, credentials)
      const { tokens } = res.data
      const user = sanitizeUser(res.data.user)

      localStorage.setItem("access_token", tokens.access)
      localStorage.setItem("refresh_token", tokens.refresh)
      localStorage.setItem("user", JSON.stringify(user))
      dispatch({ type: "SET_USER", payload: user })

      const institution = user.institution || user.profile?.institucion || null
      injectBrandColors(institution)

      const normalizedRole = normalizeRole(user.role)
      if (normalizedRole === USER_ROLES.ADMIN) navigate("/dashboard/admin")
      else if (normalizedRole === USER_ROLES.RECTOR) navigate("/dashboard/rector")
      else if (normalizedRole === USER_ROLES.COORDINATOR) navigate("/dashboard/coordinator")
      else if (normalizedRole === USER_ROLES.TEACHER) navigate("/dashboard/teacher")
      else if (normalizedRole === USER_ROLES.STUDENT) navigate("/dashboard/student")
      else navigate("/dashboard")
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Credenciales inválidas" })
      throw error
    }
  }

  const register = async (data) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      await api.post(API_ENDPOINTS.REGISTER, data)
      dispatch({ type: "SET_LOADING", payload: false })
      navigate("/login")
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    dispatch({ type: "LOGOUT" })
  }

  const logout = () => {
    handleLogout()
    navigate("/login")
  }

  const isAdmin = state.user?.role === USER_ROLES.ADMIN
  const isRector = state.user?.role === USER_ROLES.RECTOR
  const isCoordinator = state.user?.role === USER_ROLES.COORDINATOR
  const isTeacher = state.user?.role === USER_ROLES.TEACHER
  const isStudent = state.user?.role === USER_ROLES.STUDENT

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        isAdmin,
        isRector,
        isCoordinator,
        isTeacher,
        isStudent,
        setUser: (user) => dispatch({ type: "SET_USER", payload: user }),
        institution: state.user?.institution || state.user?.profile?.institucion || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de AuthProvider")
  return ctx
}
