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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <AcademicCapIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar la clase</h3>
          <p className="text-red-600 mb-4 text-sm">{classroomError?.message || "La clase no existe o no tienes acceso"}</p>
          <button 
            onClick={() => navigate("/classrooms")}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition text-sm"
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
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 line-clamp-2">
              {classroom.nombre}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Docente: {classroom.docente_nombre || "N/A"}
            </p>
          </div>
        </div>
        {isTeacher && classroom.docente === user.id && (
          <button 
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl hover:bg-yellow-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md w-full sm:w-auto justify-center mt-2 sm:mt-0"
          >
            <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Editar Clase</span>
          </button>
        )}
      </div>

      {/* Classroom Hero Card */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-white/20 rounded-xl flex-shrink-0 self-start">
            <BookOpenIcon className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
              {classroom.nombre}
            </h2>
            <p className="text-yellow-100 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2">
              {classroom.descripcion || "Sin descripción disponible"}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>{students?.length || classroom.estudiantes_count || 0} estudiantes</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>{classroom.grupos_clases?.length || 0} grupos</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Creada {formatRelativeTime(classroom.creado)}</span>
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
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              Información de la Clase
            </h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                {classroom.descripcion || "Esta clase no tiene una descripción detallada. Puedes editarla para agregar información importante para tus estudiantes."}
              </p>
            </div>
          </div>

          {/* Grupos */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                Grupos de la Clase ({classroom.grupos_clases?.length || 0})
              </h3>
            </div>

            {classroom.grupos_clases && classroom.grupos_clases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {classroom.grupos_clases.map((grupo) => (
                  <Link
                    key={grupo.id}
                    to={`/groups/${grupo.id}`}
                    className="block p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900 text-sm sm:text-base line-clamp-1">
                        {grupo.nombre}
                      </h4>
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-blue-700">
                      <span>{grupo.estudiantes?.length || 0} estudiantes</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Activo
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 bg-blue-50 rounded-lg border border-blue-200">
                <ChartBarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-300 mx-auto mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-lg font-medium text-blue-900 mb-2">No hay grupos creados</h4>
                <p className="text-blue-700 text-xs sm:text-sm mb-4 px-4">
                  {isTeacher
                    ? "Crea grupos para organizar a tus estudiantes y asignar actividades"
                    : "Espera a que el docente cree grupos en esta clase"
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Solo Estadísticas */}
        <div className="space-y-4 sm:space-y-6">
          {/* Estadísticas */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Estadísticas</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm sm:text-base">Total Estudiantes</span>
                <span className="font-semibold text-orange-600 text-sm sm:text-base">{students?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm sm:text-base">Grupos Activos</span>
                <span className="font-semibold text-blue-600 text-sm sm:text-base">{classroom.grupos_clases?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm sm:text-base">Fecha de Creación</span>
                <span className="font-medium text-gray-900 text-xs sm:text-sm text-right">
                  {formatDate(classroom.creado)}
                </span>
              </div>
              {classroom.actualizado && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">Última Actualización</span>
                  <span className="font-medium text-gray-900 text-xs sm:text-sm">
                    {formatRelativeTime(classroom.actualizado)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
            Estudiantes ({students?.length || 0})
          </h2>
        </div>

        {studentsLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : students && students.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center space-x-3 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-300 hover:bg-orange-100 transition-all duration-200"
              >
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 flex items-center justify-center transition-colors flex-shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-orange-700">
                    {student.first_name?.charAt(0)}
                    {student.last_name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-orange-900 text-xs sm:text-sm truncate">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs text-orange-700 truncate">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-orange-50 rounded-lg border border-orange-200">
            <UserGroupIcon className="h-12 w-12 sm:h-16 sm:w-16 text-orange-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-orange-900 mb-2">
              No hay estudiantes aún
            </h3>
            <p className="text-orange-700 mb-4 sm:mb-6 max-w-md mx-auto px-4 text-xs sm:text-sm">
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