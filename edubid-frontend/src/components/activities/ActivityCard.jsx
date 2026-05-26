import { Link } from "react-router-dom";
import {
  ClipboardDocumentListIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../../utils/helpers";

export default function ActivityCard({ activity, isTeacher, userSubmission }) {
  const isCompleted = !!userSubmission;
  const isGraded = userSubmission?.calificacion !== null;

  // Calcular días restantes
  const daysLeft = Math.ceil(
    (new Date(activity.fecha_entrega) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysLeft < 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Header - Purple theme */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <ClipboardDocumentListIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-purple-100 uppercase bg-white/20 px-2 py-1 rounded">
                {activity.tipo}
              </span>
              <h3 className="font-bold text-white text-base sm:text-lg mt-1 line-clamp-2">
                {activity.nombre}
              </h3>
            </div>
          </div>
          {isCompleted && (
            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-300 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        {/* Descripción */}
        <p className="text-gray-600 text-sm line-clamp-2 min-h-[40px]">
          {activity.descripcion || "Sin descripción"}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-orange-50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <CurrencyEuroIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              <span className="text-xs text-gray-600">EduBid</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-orange-600">
              {activity.valor_edubids} EC
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <ClipboardDocumentListIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Valor Nota</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-blue-600">
              {activity.valor_notas}
            </p>
          </div>
        </div>

        {/* Fecha límite */}
        <div
          className={`rounded-lg p-2 sm:p-3 ${
            isOverdue
              ? "bg-red-50 border border-red-200"
              : daysLeft <= 3
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <CalendarIcon
                className={`h-3 w-3 sm:h-4 sm:w-4 ${
                  isOverdue
                    ? "text-red-600"
                    : daysLeft <= 3
                      ? "text-yellow-600"
                      : "text-gray-600"
                }`}
              />
              <span className="text-xs sm:text-sm text-gray-700">
                {formatDate(activity.fecha_entrega)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon
                className={`h-3 w-3 sm:h-4 sm:w-4 ${
                  isOverdue
                    ? "text-red-600"
                    : daysLeft <= 3
                      ? "text-yellow-600"
                      : "text-gray-600"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  isOverdue
                    ? "text-red-600"
                    : daysLeft <= 3
                      ? "text-yellow-600"
                      : "text-gray-600"
                }`}
              >
                {isOverdue ? "Vencida" : `${daysLeft} días`}
              </span>
            </div>
          </div>
        </div>

        {/* Estado para estudiantes */}
        {!isTeacher && (
          <div className="pt-2 sm:pt-3 border-t border-gray-100">
            {isGraded ? (
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Calificación:
                </span>
                <span className="text-base sm:text-lg font-bold text-green-600">
                  {userSubmission.calificacion}/5.0
                </span>
              </div>
            ) : isCompleted ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm text-green-700 font-medium">
                  Entregada - Pendiente de calificación
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <span className="text-xs sm:text-sm text-yellow-700 font-medium">
                  Pendiente de entrega
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info para docentes */}
        {isTeacher && (
          <div className="pt-2 sm:pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Entregas:</span>
              <span className="font-semibold text-gray-900">
                {activity.submissions?.length || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions - Purple theme */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <Link
          to={`/activities/${activity.id}`}
          className="w-full bg-purple-50 text-purple-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-purple-100 transition text-center text-xs sm:text-sm font-medium group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center gap-1 sm:gap-2"
        >
          {isTeacher ? "Gestionar" : isCompleted ? "Ver Detalles" : "Entregar"}
          <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </div>
    </div>
  );
}
