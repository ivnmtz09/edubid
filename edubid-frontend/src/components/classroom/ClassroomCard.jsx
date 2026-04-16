import { Link } from "react-router-dom"
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  CalendarIcon,
  BookOpenIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline"
import { formatDate } from "../../utils/helpers"

export default function ClassroomCard({ classroom, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group h-full flex flex-col">
      {/* Header con gradiente amarillo */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
              <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-base sm:text-lg line-clamp-2">
                {classroom.nombre}
              </h3>
              <p className="text-yellow-100 text-xs sm:text-sm mt-1 line-clamp-1">
                {classroom.docente_nombre || "Docente"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col">
        {/* Descripción */}
        <p className="text-gray-600 text-sm line-clamp-2 flex-1 min-h-[40px]">
          {classroom.descripcion || "Sin descripción disponible"}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Estudiantes</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900">
              {classroom.estudiantes_count || 0}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <BookOpenIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Grupos</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900">
              {classroom.grupos_clases?.length || 0}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-2 sm:pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center text-xs text-gray-500">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Creada el {formatDate(classroom.creado)}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2">
        <Link
          to={`/classrooms/${classroom.id}`}
          className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-yellow-100 transition text-center text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 group-hover:bg-yellow-500 group-hover:text-white"
        >
          <span className="truncate">Ver Detalles</span>
          <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(classroom.id)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center justify-center min-w-[60px]"
          >
            <span className="sm:hidden">✕</span>
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        )}
      </div>
    </div>
  )
}