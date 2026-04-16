import { Link } from "react-router-dom"
import { 
  UserGroupIcon, 
  CalendarIcon,
  ClipboardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  TrashIcon
} from "@heroicons/react/24/outline"
import { formatDate } from "../../utils/helpers"
import toast from "react-hot-toast"

export default function GroupCard({ group, onDelete, isTeacher }) {
  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success("Código copiado al portapapeles")
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group h-full flex flex-col">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-base sm:text-lg truncate">
                {group.nombre}
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm truncate">
                {group.classroom?.nombre || group.classroom_nombre || "Sin clase asignada"}
              </p>
            </div>
          </div>
          {/* Badge de estado */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
            group.activo 
              ? "bg-green-400/20 text-white" 
              : "bg-red-400/20 text-white"
          }`}>
            {group.activo ? (
              <>
                <CheckCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Activo</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Inactivo</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1">
        {/* Descripción */}
        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 min-h-[40px]">
          {group.descripcion || "Sin descripción disponible"}
        </p>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <span className="text-xs sm:text-sm text-gray-600">Estudiantes</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              {group.estudiantes_count || group.estudiantes?.length || 0}
            </span>
          </div>
        </div>

        {/* Código del grupo (solo docentes) */}
        {isTeacher && group.codigo && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <ClipboardIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700 font-medium">Código:</span>
                <span className="font-mono font-bold text-orange-600 text-sm sm:text-lg tracking-wider truncate">
                  {group.codigo}
                </span>
              </div>
              <button
                onClick={() => copyCode(group.codigo)}
                className="px-2 sm:px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-xs font-medium flex-shrink-0 w-full sm:w-auto text-center"
              >
                Copiar
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-2 sm:pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Creado el {formatDate(group.creado)}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2">
        <Link
          to={`/groups/${group.id}`}
          className="flex-1 bg-blue-50 text-blue-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-100 transition text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 group-hover:bg-blue-500 group-hover:text-white"
        >
          <span>Ver Detalles</span>
          <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
        {isTeacher && onDelete && (
          <button
            onClick={() => onDelete(group.id)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs sm:text-sm font-medium flex items-center justify-center"
            title="Eliminar grupo"
          >
            <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Eliminar</span>
          </button>
        )}
      </div>
    </div>
  )
}