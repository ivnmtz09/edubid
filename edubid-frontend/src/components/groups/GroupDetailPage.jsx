import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  UserIcon,
  EnvelopeIcon,
  ClockIcon
} from "@heroicons/react/24/outline"
import { useAuthContext } from "../../context/AuthContext"
import api from "../../services/api"
import LoadingSpinner from "../common/LoadingSpinner"
import { useState } from "react"
import EditGroupModal from "./EditGroupModal"

const GroupDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [copied, setCopied] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)

  const isTeacher = user?.role === "docente"
  const isStudent = user?.role === "estudiante"

  // Fetch group details
  const { data: group, isLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/groups/${id}/`)
        return res.data
      } catch (error) {
        console.error("Error cargando grupo:", error)
        throw error
      }
    },
  })

  const formatDate = (date) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateTime = (date) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleCopyCode = () => {
    if (group?.codigo) {
      navigator.clipboard.writeText(group.codigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEdit = () => {
    setEditingGroup(group)
  }

  const handleCloseEdit = () => {
    setEditingGroup(null)
  }

  // Verificar si el código ha expirado
  const isCodeExpired = () => {
    if (!group?.codigo_expira_en) return false
    return new Date() > new Date(group.codigo_expira_en)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-sm">Cargando información del grupo...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-[400px] bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Grupo no encontrado</h2>
          <p className="text-gray-600 mb-6 text-sm">El grupo que buscas no existe o no tienes acceso.</p>
          <button
            onClick={() => navigate("/groups")}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
          >
            Volver a Grupos
          </button>
        </div>
      </div>
    )
  }

  const estudiantes = group.estudiantes_detail || []
  const classroom = group.classroom_detail || group.classroom || {}

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => navigate("/groups")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition px-3 py-2 rounded-lg hover:bg-white text-sm sm:text-base"
          >
            <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Volver a Grupos</span>
          </button>

          {isTeacher && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Editar Grupo</span>
              <span className="sm:hidden">Editar</span>
            </button>
          )}
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold line-clamp-2">
                  {group.nombre}
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base line-clamp-1">
                  Clase: {classroom.nombre || "No asignada"}
                </p>
              </div>
            </div>

            {isTeacher && group.codigo && (
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-blue-100">Código de Acceso</p>
                  {isCodeExpired() && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Expirado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-2 bg-white/20 px-3 sm:px-4 py-2 rounded-lg flex-1 min-w-0">
                    <DocumentDuplicateIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wider truncate">
                      {group.codigo}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    disabled={isCodeExpired()}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title={isCodeExpired() ? "Código expirado" : "Copiar código"}
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                    ) : (
                      <DocumentDuplicateIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1">
                  <p className="text-xs text-blue-200">
                    Comparte este código con tus estudiantes
                  </p>
                  {group.codigo_expira_en && (
                    <p className="text-xs text-blue-200 text-right sm:text-left">
                      Expira: {formatDateTime(group.codigo_expira_en)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          {/* Descripción */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
              Descripción
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {group.descripcion || "Sin descripción disponible"}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              Estadísticas
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Estudiantes:</span>
                <span className="font-bold text-orange-600 text-lg">
                  {group.estudiantes_count || estudiantes.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Estado:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    group.activo
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {group.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Creado:</span>
                <span className="font-medium text-gray-900 text-sm">
                  {formatDate(group.creado)}
                </span>
              </div>
            </div>
          </div>

          {/* Clase */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              Información de Clase
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Clase asignada:</p>
                <p className="font-semibold text-gray-900 text-base line-clamp-2">
                  {classroom.nombre || "No asignada"}
                </p>
              </div>
              {classroom.descripcion && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Descripción:</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {classroom.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estudiantes Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0" />
              Estudiantes ({estudiantes.length})
            </h2>
            {estudiantes.length > 0 && (
              <div className="text-sm text-gray-500 bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {estudiantes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
              {estudiantes.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {(student.first_name?.[0] || 'U') + (student.last_name?.[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-orange-900 text-sm truncate flex items-center gap-1">
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                      <span className="truncate">
                        {student.first_name} {student.last_name}
                      </span>
                    </p>
                    <p className="text-xs text-orange-700 truncate flex items-center gap-1 mt-1">
                      <EnvelopeIcon className="h-3 w-3 text-orange-600 flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </p>
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
              <p className="text-orange-700 text-sm sm:text-base max-w-md mx-auto px-4">
                {isTeacher
                  ? "Los estudiantes aparecerán aquí cuando se unan con el código de acceso"
                  : "Espera a que más compañeros se unan al grupo"
                }
              </p>
              {isTeacher && group.codigo && !isCodeExpired() && (
                <div className="mt-4 p-3 sm:p-4 bg-orange-100 rounded-lg border border-orange-300 max-w-md mx-auto">
                  <p className="text-xs sm:text-sm text-orange-800">
                    Comparte el código <strong className="text-orange-900">{group.codigo}</strong> con tus estudiantes
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actividades del Grupo */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
              Actividades del Grupo
            </h2>
            {isTeacher && (
              <button
                onClick={() => navigate("/activities")}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm sm:text-base flex items-center gap-1"
              >
                <span>Gestionar actividades</span>
                <ArrowLeftIcon className="h-4 w-4 transform rotate-180" />
              </button>
            )}
          </div>

          <div className="text-center py-8 sm:py-12 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-200">
            <ClipboardDocumentListIcon className="h-12 w-12 sm:h-16 sm:w-16 text-purple-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-purple-900 mb-2">
              No hay actividades asignadas
            </h3>
            <p className="text-purple-700 text-sm sm:text-base mb-4 max-w-md mx-auto px-4">
              Las actividades asignadas a este grupo aparecerán aquí
            </p>
            {isTeacher && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate("/activities")}
                  className="bg-purple-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-600 transition font-medium text-sm sm:text-base"
                >
                  Ver actividades
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional para móviles */}
        <div className="lg:hidden mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <ClockIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Información del grupo</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Creado el {formatDateTime(group.creado)} • {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''}
          </p>
        </div>

      </div>

      {/* Edit Modal */}
      {editingGroup && (
        <EditGroupModal 
          group={editingGroup}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  )
}

export default GroupDetailPage