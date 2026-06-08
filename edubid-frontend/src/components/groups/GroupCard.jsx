import { Link } from "react-router-dom";
import {
  UserGroupIcon,
  CalendarIcon,
  ClipboardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function GroupCard({ group, onDelete, onEdit, role }) {
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado al portapapeles");
  };

  const isTeacher = role === "docente";

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group h-full flex flex-col w-full">
      {/* Header */}
      <div className="bg-blue-600 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-base sm:text-lg truncate text-wrap-balance">
                {group.nombre}
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">
                {group.classroom?.nombre ||
                  group.classroom_nombre ||
                  "Sin clase asignada"}
              </p>
            </div>
          </div>
          {/* Status badge */}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${group.activo ? "bg-white/20 text-white" : "bg-white/10 text-white/60"}`}
          >
            {group.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1">
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm line-clamp-2 min-h-[40px]">
          {group.descripcion || "Sin descripción disponible"}
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Estudiantes
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tabular-nums">
              {group.estudiantes_count || group.estudiantes?.length || 0}
            </span>
          </div>
        </div>

        {isTeacher && group.codigo && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <ClipboardIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Código:
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-lg tracking-wider truncate">
                  {group.codigo}
                </span>
              </div>
              <button
                onClick={() => copyCode(group.codigo)}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 text-xs font-medium flex-shrink-0 w-full sm:w-auto text-center active:scale-[0.96]"
              >
                Copiar
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate tabular-nums">
              Creado el {formatDate(group.creado)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2 mt-auto">
        <Link
          to={`/groups/${group.id}`}
          className="flex-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors duration-200 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 active:scale-[0.96]"
        >
          <span>Ver Detalles</span>
          <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
        {isTeacher && (
          <>
            <button
              onClick={() => onEdit(group.id)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors duration-200 text-xs sm:text-sm font-medium flex items-center justify-center active:scale-[0.96]"
              title="Editar grupo"
            >
              <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Editar</span>
            </button>
            <button
              onClick={() => onDelete(group.id)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors duration-200 text-xs sm:text-sm font-medium flex items-center justify-center active:scale-[0.96]"
              title="Eliminar grupo"
            >
              <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Eliminar</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
