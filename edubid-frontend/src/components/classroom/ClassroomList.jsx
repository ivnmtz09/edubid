import { useState } from "react"
import { Link } from "react-router-dom"
import { 
  PlusIcon, 
  AcademicCapIcon, 
  UserGroupIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  TrashIcon
} from "@heroicons/react/24/outline"
import { useClassrooms, useCreateClassroom, useDeleteClassroom } from "../../hooks/useClassrooms"
import { useAuthContext } from "../../context/AuthContext"
import LoadingSpinner from "../common/LoadingSpinner"
import Modal from "../common/Modal"
import { formatDate, formatRelativeTime } from "../../utils/helpers"

export default function ClassroomList() {
  const { user } = useAuthContext()
  const { data: classrooms, isLoading, refetch } = useClassrooms()
  const createMutation = useCreateClassroom()
  const deleteMutation = useDeleteClassroom()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: ""
  })

  const isTeacher = user?.role === "docente"

  const filteredClassrooms = classrooms?.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Estadísticas
  const stats = {
    total: classrooms?.length || 0,
    totalStudents: classrooms?.reduce((sum, c) => sum + (c.estudiantes_count || 0), 0) || 0,
    totalGroups: classrooms?.reduce((sum, c) => sum + (c.grupos_clases?.length || 0), 0) || 0,
    recent: classrooms?.filter(c => {
      const created = new Date(c.creado)
      const now = new Date()
      const diffDays = (now - created) / (1000 * 60 * 60 * 24)
      return diffDays < 7
    }).length || 0
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      alert("Por favor ingresa un nombre para la clase")
      return
    }

    try {
      await createMutation.mutateAsync(formData)
      setShowCreateModal(false)
      setFormData({ nombre: "", descripcion: "" })
      refetch()
    } catch (error) {
      console.error("Error creando clase:", error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta clase? Esta acción no se puede deshacer.")) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error("Error eliminando clase:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex-shrink-0">
              <AcademicCapIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Clases</h1>
              <p className="text-gray-600 mt-1 text-base sm:text-lg">
                {isTeacher 
                  ? "Gestiona tus clases, grupos y estudiantes" 
                  : "Clases en las que estás inscrito"}
              </p>
            </div>
          </div>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-xl hover:bg-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium w-full lg:w-auto justify-center"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nueva Clase</span>
          </button>
        )}
      </div>

      {/* Estadísticas para docentes */}
      {isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Clases</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Estudiantes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalGroups}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Grupos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.recent}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Recientes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clases por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Classrooms Grid */}
      {filteredClassrooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group h-full flex flex-col"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                      <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base sm:text-lg line-clamp-2">
                        {classroom.nombre}
                      </h3>
                      {classroom.docente_nombre && (
                        <p className="text-yellow-100 text-xs sm:text-sm mt-1 line-clamp-1">
                          {classroom.docente_nombre}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col">
                <p className="text-gray-600 text-sm line-clamp-3 flex-1 min-h-[60px]">
                  {classroom.descripcion || "Sin descripción disponible"}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Estudiantes:</span>
                    </div>
                    <span className="font-semibold text-blue-600 text-sm">
                      {classroom.estudiantes_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Grupos:</span>
                    </div>
                    <span className="font-semibold text-green-600 text-sm">
                      {classroom.grupos_clases?.length || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Creada:</span>
                    </div>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">
                      {formatRelativeTime(classroom.creado) || formatDate(classroom.creado)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2">
                <Link
                  to={`/classrooms/${classroom.id}`}
                  className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-yellow-100 transition text-center text-sm font-medium"
                >
                  Ver Detalles
                </Link>
                {isTeacher && (
                  <button
                    onClick={() => handleDelete(classroom.id)}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center justify-center min-w-[44px] sm:min-w-[60px] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar clase"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <AcademicCapIcon className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? "No se encontraron clases" : "No hay clases disponibles"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto px-4 text-sm sm:text-base">
            {searchTerm 
              ? "Intenta con otros términos de búsqueda"
              : isTeacher
                ? "Comienza creando tu primera clase para organizar a tus estudiantes"
                : "Espera a que tu docente te agregue a una clase"
            }
          </p>
          {isTeacher && !searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Crear Primera Clase
            </button>
          )}
        </div>
      )}

      {/* Create Modal Responsive */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Clase"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Clase *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm sm:text-base"
              placeholder="Ej: Matemáticas 10°A - 2024"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-2">
              {formData.nombre.length}/100 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              rows={3}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
              placeholder="Describe brevemente el contenido, objetivos o información importante de la clase..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-2">
              {formData.descripcion.length}/500 caracteres
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
            <h4 className="font-medium text-yellow-900 text-sm mb-2">Información importante</h4>
            <ul className="text-sm text-yellow-700 space-y-1 text-xs sm:text-sm">
              <li>• Podrás crear grupos dentro de esta clase</li>
              <li>• Los estudiantes se unirán a través de códigos de grupo</li>
              <li>• Podrás asignar actividades a grupos específicos</li>
              <li>• Gestionarás Educoins y calificaciones por clase</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !formData.nombre.trim()}
              className="flex-1 bg-yellow-500 text-white px-4 py-2.5 sm:py-3 rounded-xl hover:bg-yellow-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {createMutation.isPending ? "Creando..." : "Crear Clase"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}