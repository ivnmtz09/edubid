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
        <span className="ml-3 text-gray-500 dark:text-gray-400 text-sm sm:text-base">Cargando grupos...</span>
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
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full"
            >
              {/* Card Header */}
              <div className="bg-blue-600 p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex-shrink-0">
                      <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate text-wrap-balance">
                        {group.nombre}
                      </h3>
                      <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">
                        {group.classroom?.nombre || 
                         group.classroom_detail?.nombre || 
                         group.classroom?.nombre || 
                         "Sin clase asignada"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${group.activo ? "bg-white/20 text-white" : "bg-white/10 text-white/60"}`}>
                    {group.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-blue-100/80 line-clamp-2">
                  {group.descripcion || "Sin descripción"}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 sm:space-x-2 text-gray-500 dark:text-gray-400">
                    <UserGroupIcon className="h-4 w-4" />
                    <span className="tabular-nums">{group.estudiantes_count || group.estudiantes?.length || 0} estudiantes</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="tabular-nums">{formatDate(group.creado)}</span>
                  </div>
                </div>

                {/* Código del grupo */}
                {isTeacher && group.codigo && (
                  <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <ClipboardIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base truncate">
                          {group.codigo}
                        </span>
                      </div>
                      <button
                        onClick={() => copyCode(group.codigo)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium whitespace-nowrap ml-2 flex items-center gap-1 active:scale-[0.96]"
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
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex gap-2 mt-auto">
                <Link
                  to={`/groups/${group.id}`}
                  className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors duration-200 text-center text-xs sm:text-sm font-medium active:scale-[0.96]"
                >
                  <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Ver Detalles</span>
                </Link>
                
                {isTeacher && (
                  <>
                    <button
                      onClick={() => handleEdit(group)}
                      className="p-2 sm:p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-colors duration-200 flex items-center justify-center active:scale-[0.96]"
                      title="Editar grupo"
                    >
                      <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-2 sm:p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/20 transition-colors duration-200 flex items-center justify-center active:scale-[0.96]"
                      title="Eliminar grupo"
                    >
                      <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1">Eliminar</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm">
          <UserGroupIcon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isTeacher ? "No hay grupos creados" : "Aún no estás en ningún grupo"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-6">
            {isTeacher
              ? "Crea tu primer grupo para organizar a tus estudiantes y asignarles actividades."
              : "Usa el código de acceso que te proporcionó tu profesor para unirte a un grupo."}
          </p>
          {isTeacher ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base shadow-sm hover:shadow-md active:scale-[0.96]"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Crear mi primer grupo
            </button>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>¿Cómo unirte?</strong> Pídele a tu profesor el código de acceso del grupo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mobile info bar */}
      {groups && groups.length > 0 && (
        <div className="lg:hidden bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800 dark:text-blue-300 font-medium">
              {groups.length} grupo{groups.length !== 1 ? 's' : ''} en total
            </span>
            <span className="text-blue-700 dark:text-blue-300">
              <span className="tabular-nums">
                {groups.reduce((total, group) => total + (group.estudiantes_count || group.estudiantes?.length || 0), 0)}
              </span> estudiantes
            </span>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateGroup onClose={() => setShowCreateModal(false)} />
      )}

      {editingGroup && (
        <EditGroupModal 
          group={editingGroup}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  )
}
