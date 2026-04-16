"use client"

import { useAuthContext } from "../../context/AuthContext"
import StudentDashboard from "../../components/dashboard/StudentDashboard"
import TeacherDashboard from "../../components/dashboard/TeacherDashboard"
import AdminDashboard from "../../components/dashboard/AdminDashboard"
import { USER_ROLES } from "../../utils/constants"

export default function DashboardPage() {
  const { user } = useAuthContext()

  if (!user) return <p>Cargando...</p>

  switch (user.role) {
    case USER_ROLES.STUDENT:
      return <StudentDashboard />
    case USER_ROLES.TEACHER:
      return <TeacherDashboard />
    case USER_ROLES.ADMIN:
      return <AdminDashboard />
    default:
      return <p>No tienes un dashboard asignado.</p>
  }
}
