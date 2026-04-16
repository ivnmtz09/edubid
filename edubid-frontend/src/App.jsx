"use client"

import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthContext } from "./context/AuthContext"

// Layout principal
import Layout from "./components/common/Layout"

// Pantallas de autenticación
import AuthLandingPage from "./pages/auth/AuthLandingPage"
import VerifyEmailPage from "./pages/auth/VerifyEmailPage"
import EmailSentPage from "./pages/auth/EmailSentPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "./pages/auth/ResetPasswordPage"

// Pantallas principales
import DashboardPage from "./pages/dashboard/DashboardPage"
import ClassroomsPage from "./pages/classrooms/ClassroomsPage"
import ClassroomDetailPage from "./pages/classrooms/ClassroomDetailPage"
import GroupsPage from "./pages/groups/GroupsPage"
import GroupDetailPage from "./pages/groups/GroupDetailPage"
import ActivitiesPage from "./pages/activities/ActivitiesPage"
import ActivityDetailPage from "./pages/activities/ActivityDetailPage"
import AuctionsPage from "./pages/auctions/AuctionsPage"
import AuctionDetailPage from "./pages/auctions/AuctionDetailPage"
import ProfilePage from "./pages/profile/ProfilePage"
import WalletPage from "./pages/wallet/WalletPage"

// Componentes comunes
import LoadingScreen from "./components/common/LoadingScreen"

function App() {
  const { isAuthenticated, isLoading, logout } = useAuthContext()

  console.log("Auth state:", { isAuthenticated, isLoading })

  // Listener global para logout
  useEffect(() => {
    const handleLogout = () => {
      logout()
    }

    window.addEventListener("educoin:logout", handleLogout)
    return () => window.removeEventListener("educoin:logout", handleLogout)
  }, [logout])

  // Pantalla de carga global
  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      {/* ========================================
          RUTAS PÚBLICAS (sin autenticación)
      ======================================== */}
      <Route path="/" element={!isAuthenticated ? <AuthLandingPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/login" element={!isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/dashboard" replace />} />
      
      {/* Rutas de verificación y reset (accesibles sin login) */}
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/email-sent" element={<EmailSentPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordPage />} />

      {/* ========================================
          RUTAS PRIVADAS (requieren autenticación)
      ======================================== */}
      {isAuthenticated && (
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Classrooms */}
          <Route path="classrooms" element={<ClassroomsPage />} />
          <Route path="classrooms/:id" element={<ClassroomDetailPage />} />
          
          {/* Groups */}
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:id" element={<GroupDetailPage />} />
          
          {/* Activities */}
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="activities/:id" element={<ActivityDetailPage />} />
          
          {/* Auctions */}
          <Route path="auctions" element={<AuctionsPage />} />
          <Route path="auctions/:id" element={<AuctionDetailPage />} />
          
          {/* Profile & Wallet */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="wallet" element={<WalletPage />} />
        </Route>
      )}

      {/* ========================================
          CATCH-ALL (rutas no encontradas)
      ======================================== */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  )
}

export default App