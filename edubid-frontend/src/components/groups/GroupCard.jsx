import { Link } from "react-router-dom";
import {
  UserGroupIcon,
  CalendarIcon,
  ClipboardIcon,
  ArrowRightIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

// Módulo: GRUPOS — Paleta semántica Blue
// Shell unificado: mismo en todos los módulos (ClassroomCard / GroupCard / ActivityCard)
export default function GroupCard({ group, onDelete, onEdit, role }) {
  const isTeacher = role === "docente";

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado al portapapeles");
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-xl flex-shrink-0">
          <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug [text-wrap:balance]">
            {group.nombre}
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
            {group.classroom?.nombre || group.classroom_nombre || "Sin clase asignada"}
          </p>
        </div>
        {/* Badge activo/inactivo */}
        <span
          className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
            group.activo
              ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50"
              : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10"
          }`}
        >
          {group.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* ── Body — flex-1 asegura que el footer siempre quede abajo ── */}
      <div className="flex-1 flex flex-col gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 [text-wrap:pretty]">
          {group.descripcion || "Sin descripción disponible"}
        </p>

        {/* Stat: Estudiantes */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Estudiantes</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
            {group.estudiantes_count || group.estudiantes?.length || 0}
          </span>
        </div>

        {/* Código de acceso (solo docente) */}
        {isTeacher && group.codigo && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Código:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm tracking-wider truncate">
                {group.codigo}
              </span>
            </div>
            <button
              onClick={() => copyCode(group.codigo)}
              className="flex-shrink-0 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium active:scale-[0.96] transition-all"
            >
              Copiar
            </button>
          </div>
        )}

        {/* Fecha (empuja el footer hacia abajo) */}
        <div className="mt-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="tabular-nums">Creado el {formatDate(group.creado)}</span>
        </div>
      </div>

      {/* ── Footer — padding y gap idénticos en ambos roles ─── */}
      {/*  Docente:    [Ver Detalles flex-1] [Editar px-4] [Eliminar px-4]  */}
      {/*  Estudiante: [Ver Detalles w-full]                                 */}
      <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
        <Link
          to={`/groups/${group.id}`}
          className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl py-2.5 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.96] transition-all"
        >
          Ver Detalles
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>

        {/* Solo docente */}
        {isTeacher ? (
          <>
            <button
              onClick={() => onEdit(group.id)}
              title="Editar grupo"
              className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all active:scale-[0.96] flex items-center justify-center gap-1.5"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Editar</span>
            </button>
            <button
              onClick={() => onDelete(group.id)}
              title="Eliminar grupo"
              className="px-4 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-[0.96] flex items-center justify-center gap-1.5"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Eliminar</span>
            </button>
          </>
        ) : (
          /* Placeholder invisible — la tarjeta del estudiante tiene la misma altura */
          <div className="w-0 overflow-hidden" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
