import { Link } from "react-router-dom";
import {
  ClipboardDocumentListIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../../utils/helpers";

// Módulo: ACTIVIDADES — Paleta semántica Purple
// Shell unificado: mismo en todos los módulos (ClassroomCard / GroupCard / ActivityCard)
export default function ActivityCard({ activity, isTeacher, userSubmission }) {
  const isCompleted = !!userSubmission;
  const isGraded =
    userSubmission?.calificacion !== null &&
    userSubmission?.calificacion !== undefined;

  const daysLeft = Math.ceil(
    (new Date(activity.fecha_entrega) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysLeft < 0;
  const isUrgent = !isOverdue && daysLeft <= 3;

  // Badge semántico de estado (usa el color correcto según contexto)
  const getStatus = () => {
    if (isTeacher)
      return activity.habilitada
        ? { label: "Activa",    classes: "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50" }
        : { label: "Inactiva",  classes: "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10" };

    if (isGraded)    return { label: "Calificada", classes: "bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50" };
    if (isCompleted) return { label: "Entregada",  classes: "bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50" };
    if (isOverdue)   return { label: "Vencida",    classes: "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50" };
    return              { label: "Pendiente",  classes: "bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50" };
  };

  const status = getStatus();
  const ctaLabel = isTeacher ? "Gestionar" : isCompleted ? "Ver Detalles" : "Entregar";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/50 rounded-xl flex-shrink-0">
          <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
            {activity.tipo}
          </span>
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 [text-wrap:balance] mt-0.5">
            {activity.nombre}
          </h3>
        </div>
        {/* Badge de estado */}
        <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.classes}`}>
          {status.label}
        </span>
      </div>

      {/* ── Body — flex-1 asegura que el footer siempre quede abajo ── */}
      <div className="flex-1 flex flex-col gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 [text-wrap:pretty]">
          {activity.descripcion || "Sin descripción"}
        </p>

        {/* Stats: EduBids + Nota */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CurrencyEuroIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">EduBids</span>
            </div>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
              {activity.valor_edubids} <span className="text-sm font-medium">EC</span>
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AcademicCapIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Nota</span>
            </div>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
              {activity.valor_notas} <span className="text-sm font-medium">pts</span>
            </p>
          </div>
        </div>

        {/* Fecha límite — urgente o normal */}
        <div
          className={`rounded-xl p-3 flex items-center justify-between ${
            isOverdue || isUrgent
              ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50"
              : "bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CalendarIcon
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                isOverdue || isUrgent ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
              }`}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {formatDate(activity.fecha_entrega)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                isOverdue || isUrgent ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
              }`}
            />
            <span
              className={`text-xs font-semibold tabular-nums ${
                isOverdue || isUrgent ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {isOverdue ? "Vencida" : `${daysLeft}d restantes`}
            </span>
          </div>
        </div>

        {/* Estado de entrega (estudiante) / Contador de entregas (docente) */}
        <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-auto">
          {isTeacher ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Entregas recibidas:</span>
              <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                {activity.submissions?.length || 0}
              </span>
            </div>
          ) : isGraded ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Tu calificación:</span>
              <span className="text-base font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                {userSubmission.calificacion}
                <span className="text-xs font-medium text-gray-400">/{activity.valor_notas}</span>
              </span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                Entregada — pendiente de calificación
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                Pendiente de entrega
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer — padding y gap idénticos en ambos roles ─── */}
      {/*  Docente:    [Gestionar w-full]                       */}
      {/*  Estudiante: [Ver Detalles / Entregar w-full]         */}
      <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
        <Link
          to={`/activities/${activity.id}`}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl py-2.5 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.96] transition-all"
        >
          {ctaLabel}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
