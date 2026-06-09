import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../../utils/helpers";

// Módulo: CLASES — Paleta semántica Yellow
// Shell unificado: mismo en todos los módulos (ClassroomCard / GroupCard / ActivityCard)
export default function ClassroomCard({ classroom, onDelete }) {
  const isTeacher = !!onDelete; // onDelete solo se pasa cuando el rol es docente

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-xl flex-shrink-0">
          <AcademicCapIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug [text-wrap:balance]">
            {classroom.nombre}
          </h3>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5 truncate">
            {classroom.docente_nombre || "Docente"}
          </p>
        </div>
      </div>

      {/* ── Body — flex-1 asegura que el footer siempre quede abajo ── */}
      <div className="flex-1 flex flex-col gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 [text-wrap:pretty]">
          {classroom.descripcion || "Sin descripción disponible"}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <UserGroupIcon className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Estudiantes</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {classroom.estudiantes_count || 0}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AcademicCapIcon className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Grupos</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {classroom.grupos_clases?.length || 0}
            </p>
          </div>
        </div>

        {/* Fecha (empuja el footer hacia abajo) */}
        <div className="mt-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <span className="tabular-nums">Creada el {formatDate(classroom.creado)}</span>
        </div>
      </div>

      {/* ── Footer — padding y gap idénticos en ambos roles ─── */}
      {/*  Docente:    [Ver Detalles flex-1] [Eliminar px-4]      */}
      {/*  Estudiante: [Ver Detalles w-full]                      */}
      <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
        <Link
          to={`/classrooms/${classroom.id}`}
          className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl py-2.5 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.96] transition-all"
        >
          Ver Detalles
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>

        {/* Solo docente — mismo espacio reservado para paridad de altura */}
        {isTeacher ? (
          <button
            onClick={() => onDelete(classroom.id)}
            title="Eliminar clase"
            className="px-4 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-[0.96] flex items-center justify-center gap-1.5"
          >
            <TrashIcon className="h-4 w-4" />
            <span className="hidden sm:inline text-sm font-medium">Eliminar</span>
          </button>
        ) : (
          /* Placeholder invisible para mantener la misma altura del footer entre roles */
          <div className="w-0 overflow-hidden" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
