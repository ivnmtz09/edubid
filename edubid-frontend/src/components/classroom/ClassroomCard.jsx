import { Link } from "react-router-dom"
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline"
import { formatDate } from "../../utils/helpers"

export default function ClassroomCard({ classroom, onDelete }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl flex-shrink-0">
            <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-base sm:text-lg text-wrap-balance">
              {classroom.nombre}
            </h3>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 truncate">
              {classroom.docente_nombre || "Docente"}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1 min-h-[40px]">
          {classroom.descripcion || "Sin descripción disponible"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <UserGroupIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Estudiantes</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {classroom.estudiantes_count || 0}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AcademicCapIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Grupos</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {classroom.grupos_clases?.length || 0}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-white/5 mt-auto">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="tabular-nums">Creada el {formatDate(classroom.creado)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex gap-2">
        <Link
          to={`/classrooms/${classroom.id}`}
          className="flex-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-2.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors duration-200 text-center text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.96]"
        >
          <span>Ver Detalles</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(classroom.id)}
            className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 text-sm font-medium flex items-center justify-center min-w-[44px] active:scale-[0.96]"
          >
            <span className="sm:hidden" aria-hidden="true">✕</span>
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        )}
      </div>
    </div>
  )
}
