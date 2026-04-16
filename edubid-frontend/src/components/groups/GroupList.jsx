import { useState } from "react"
import { Link } from "react-router-dom"
import { 
  PlusIcon, 
  UserGroupIcon,
  CalendarIcon,
  ClipboardIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon
} from "@heroicons/react/24/outline"
import { useGroups, useDeleteGroup } from "../../hooks/useGroups"
import { useAuthContext } from "../../context/AuthContext"
import LoadingSpinner from "../common/LoadingSpinner"
import Modal from "../common/Modal"
import CreateGroup from "./CreateGroup"
import EditGroupModal from "./EditGroupModal"
import { formatDate } from "../../utils/helpers"
import toast from "react-hot-toast"

export default function GroupList() {
  const { user } = useAuthContext()
  const { data: groups, isLoading, refetch } = useGroups()
  const deleteMutation = useDeleteGroup()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)

  const isTeacher = user?.role === "docente"

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este grupo? Esta acción no se puede deshacer.")) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success("Grupo eliminado correctamente")
        refetch()
      } catch (error) {
        toast.error("Error al eliminar el grupo")
        console.error("Error eliminando grupo:", error)
      }
    }
  }

  const handleEdit = (group) => {
    setEditingGroup(group)
  }

  const handleCloseEdit = () => {
    setEditingGroup(null)
    refetch()
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success("Código copiado al portapapeles")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 text-sm sm:text-base">Cargando grupos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Groups Grid */}
      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 text-white">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                      <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold truncate">
                        {group.nombre}
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-100 mt-1 truncate">
                        {group.classroom_nombre || 
                         group.classroom_detail?.nombre || 
                         group.classroom?.nombre || 
                         "Sin clase asignada"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    group.activo 
                      ? "bg-green-400/20 text-white" 
                      : "bg-gray-400/20 text-white"
                  }`}>
                    {group.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-blue-100 line-clamp-2">
                  {group.descripcion || "Sin descripción"}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{group.estudiantes_count || group.estudiantes?.length || 0} estudiantes</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">{formatDate(group.creado)}</span>
                  </div>
                </div>

                {/* Código del grupo */}
                {isTeacher && group.codigo && (
                  <div className="pt-2 sm:pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <ClipboardIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-mono font-bold text-blue-700 text-sm sm:text-base truncate">
                          {group.codigo}
                        </span>
                      </div>
                      <button
                        onClick={() => copyCode(group.codigo)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap ml-2 flex items-center gap-1"
                      >
                        {copiedCode === group.codigo ? (
                          <>
                            <CheckIcon className="h-3 w-3" />
                            Copiado
                          </>
                        ) : (
                          "Copiar"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex gap-2">
                <Link
                  to={`/groups/${group.id}`}
                  className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-blue-50 text-blue-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-100 transition font-medium text-xs sm:text-sm"
                >
                  <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Ver Detalles</span>
                </Link>
                
                {isTeacher && (
                  <>
                    <button
                      onClick={() => handleEdit(group)}
                      className="p-2 sm:p-2.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition flex items-center justify-center"
                      title="Editar grupo"
                    >
                      <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-2 sm:p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                      title="Eliminar grupo"
                    >
                      <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200">
          <UserGroupIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            No hay grupos disponibles
          </h3>
          <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto px-4">
            Comienza creando tu primer grupo para organizar a tus estudiantes
          </p>
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-blue-600 transition inline-flex items-center gap-2 text-sm sm:text-base"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Crear Primer Grupo
            </button>
          )}
        </div>
      )}

      {/* Información adicional para móviles */}
      {groups && groups.length > 0 && (
        <div className="lg:hidden bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800 font-medium">
              {groups.length} grupo{groups.length !== 1 ? 's' : ''} en total
            </span>
            <span className="text-blue-700">
              {groups.reduce((total, group) => total + (group.estudiantes_count || group.estudiantes?.length || 0), 0)} estudiantes
            </span>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGroup onClose={() => setShowCreateModal(false)} />
      )}

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