import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"
import { API_ENDPOINTS } from "../utils/constants"
import { useAuthContext } from "./AuthContext"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const access = localStorage.getItem("access_token")
    const storedUser = localStorage.getItem("user")

    if (access && storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, { email, password })
      const { access, refresh, user } = response.data

      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
      localStorage.setItem("user", JSON.stringify(user))

      setUser(user)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error("Error en login:", error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    setUser(null)
    setIsAuthenticated(false)
    window.location.href = "/"
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setIsAuthenticated,
    isTeacher: user?.role === "docente",
    isStudent: user?.role === "estudiante",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
