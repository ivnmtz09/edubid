"use client"

import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  BookOpenIcon,
  PencilIcon,
  ChartBarIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline"
import { useClassroom, useClassroomStudents } from "../../hooks/useClassrooms"
import { useAuthContext } from "../../context/AuthContext"
import { formatDate, formatRelativeTime } from "../../utils/helpers"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { useState } from "react"
import EditClassroomModal from "../../components/classroom/EditClassroomModal"

const ClassroomDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { data: classroom, isLoading: classroomLoading, error: classroomError, refetch } = useClassroom(id)
  const { data: students, isLoading: studentsLoading } = useClassroomStudents(id)

  const [showEditModal, setShowEditModal] = useState(false)
  const isTeacher = user?.role === "docente"

  if (classroomLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (classroomError || !classroom) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md mx-auto">
          <AcademicCapIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error al cargar la clase</h3>
          <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{classroomError?.message || "La clase no existe o no tienes acceso"}</p>
          <button
            onClick={() => navigate("/classrooms")}
            className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition-all duration-200 text-sm active:scale-[0.96]"
          >
            Volver a Clases
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/classrooms")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0 active:scale-[0.96]"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white line-clamp-2 text-wrap-balance">
              {classroom.nombre}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Docente: {classroom.docente_nombre || "N/A"}
            </p>
          </div>
        </div>
        {isTeacher && classroom.docente === user.id && (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl hover:bg-amber-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md w-full sm:w-auto justify-center mt-2 sm:mt-0 active:scale-[0.96]"
          >
            <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Editar Clase</span>
          </button>
        )}
      </div>

      {/* Classroom Hero Card — clean surface, amber accent only at top */}
      <div className="bg-white dark:bg-gray-900 border-t-4 border-amber-500 rounded-2xl p-4 sm:p-6 shadow-sm dark:border dark:border-white/5 dark:border-t-amber-500">
        <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-amber-100 dark:bg-amber-500/10 rounded-xl flex-shrink-0 self-start">
            <BookOpenIcon className="h-8 w-8 sm:h-12 sm:w-12 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-wrap-balance">
              {classroom.nombre}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2">
              {classroom.descripcion || "Sin descripción disponible"}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
                <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="tabular-nums">{students?.length || classroom.estudiantes_count || 0} estudiantes</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
                <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="tabular-nums">{classroom.grupos_clases?.length || 0} grupos</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="tabular-nums">Creada {formatRelativeTime(classroom.creado)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Descripción */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Información General */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              Información de la Clase
            </h3>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {classroom.descripcion || "Esta clase no tiene una descripción detallada. Puedes editarla para agregar información importante para tus estudiantes."}
              </p>
            </div>
          </div>

          {/* Grupos */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                Grupos de la Clase <span className="tabular-nums">({classroom.grupos_clases?.length || 0})</span>
              </h3>
            </div>

            {classroom.grupos_clases && classroom.grupos_clases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {classroom.grupos_clases.map((grupo) => (
                  <Link
                    key={grupo.id}
                    to={`/groups/${grupo.id}`}
                    className="block p-3 sm:p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all duration-200 group active:scale-[0.96]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm sm:text-base line-clamp-1">
                        {grupo.nombre}
                      </h4>
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                      <span className="tabular-nums">{grupo.estudiantes?.length || 0} estudiantes</span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        Activo
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                <ChartBarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-300 dark:text-blue-500 mx-auto mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">No hay grupos creados</h4>
                <p className="text-blue-700 dark:text-blue-400 text-xs sm:text-sm mb-4 px-4">
                  {isTeacher
                    ? "Crea grupos para organizar a tus estudiantes y asignar actividades"
                    : "Espera a que el docente cree grupos en esta clase"
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Estadísticas */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Estadísticas</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Total Estudiantes</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 text-sm sm:text-base tabular-nums">{students?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Grupos Activos</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm sm:text-base tabular-nums">{classroom.grupos_clases?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Fecha de Creación</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm text-right tabular-nums">
                  {formatDate(classroom.creado)}
                </span>
              </div>
              {classroom.actualizado && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Última Actualización</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm tabular-nums">
                    {formatRelativeTime(classroom.actualizado)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            Estudiantes <span className="tabular-nums">({students?.length || 0})</span>
          </h2>
        </div>

        {studentsLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : students && students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center space-x-3 p-3 sm:p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-all duration-200"
              >
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">
                    {student.first_name?.charAt(0)}
                    {student.last_name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <UserGroupIcon className="h-12 w-12 sm:h-16 sm:w-16 text-amber-300 dark:text-amber-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-amber-900 dark:text-amber-300 mb-2">
              No hay estudiantes aún
            </h3>
            <p className="text-amber-700 dark:text-amber-400 mb-4 sm:mb-6 max-w-md mx-auto px-4 text-xs sm:text-sm">
              {isTeacher
                ? "Los estudiantes aparecerán aquí cuando se unan a los grupos de esta clase mediante códigos de acceso"
                : "Espera a que tu profesor te agregue a un grupo de esta clase"
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <EditClassroomModal
          classroom={classroom}
          onClose={() => {
            setShowEditModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

export default ClassroomDetailPage
