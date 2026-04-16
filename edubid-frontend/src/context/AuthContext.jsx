"use client"

import { createContext, useContext, useReducer, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import { API_ENDPOINTS, USER_ROLES } from "../utils/constants"

const AuthContext = createContext()

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
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

  // Cargar perfil si hay token
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token")
      if (token) {
        try {
          const response = await api.get(API_ENDPOINTS.PROFILE)
          const user = response.data.user || response.data
          dispatch({ type: "SET_USER", payload: user })
        } catch (err) {
          console.error("Error cargando perfil:", err)
          handleLogout()
        }
      }
    }
    loadProfile()
  }, [])

  const normalizeRole = (role) => {
    if (!role) return null
    const lower = role.toString().toLowerCase()
    if (lower.includes("teacher") || lower.includes("docente")) return USER_ROLES.TEACHER
    if (lower.includes("student") || lower.includes("estudiante")) return USER_ROLES.STUDENT
    if (lower.includes("admin")) return USER_ROLES.ADMIN
    return null
  }

  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const res = await api.post(API_ENDPOINTS.LOGIN, credentials)
      const { user, tokens } = res.data

      localStorage.setItem("access_token", tokens.access)
      localStorage.setItem("refresh_token", tokens.refresh)
      localStorage.setItem("user", JSON.stringify(user))
      dispatch({ type: "SET_USER", payload: user })

      const normalizedRole = normalizeRole(user.role)
      if (normalizedRole === USER_ROLES.ADMIN) navigate("/dashboard/admin")
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
    localStorage.clear()
    dispatch({ type: "LOGOUT" })
  }

  const logout = () => {
    handleLogout()
    navigate("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        setUser: (user) => dispatch({ type: "SET_USER", payload: user }),
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
