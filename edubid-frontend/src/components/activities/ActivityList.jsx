import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useActivities, useDeleteActivity } from "../../hooks/useActivities";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ListBulletIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../common/LoadingSpinner";
import Modal from "../common/Modal";
import CreateActivity from "./CreateActivity";

// Mapa de iconos por tipo de actividad
const TIPO_ICONS = {
  tarea: ClipboardDocumentCheckIcon,
  examen: AcademicCapIcon,
  proyecto: CheckCircleIcon,
  quiz: ClockIcon,
  exposicion: CalendarIcon,
};

const ActivityList = ({ onCreateClick }) => {
  const { user } = useAuthContext();
  const isTeacher = user?.role === "docente";
  const isStudent = user?.role === "estudiante";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: activities, isLoading, refetch } = useActivities();
  const deleteActivity = useDeleteActivity();

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta actividad?")) {
      await deleteActivity.mutateAsync(id);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingActivity(null);
    refetch();
  };

  const filteredActivities =
    activities?.filter((activity) => {
      const matchesSearch =
        activity.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || activity.tipo === typeFilter;

      if (isStudent) {
        const hasSubmission =
          activity.user_submission !== null &&
          activity.user_submission !== undefined;
        if (statusFilter === "pendientes")
          return matchesSearch && matchesType && !hasSubmission;
        if (statusFilter === "completadas")
          return matchesSearch && matchesType && hasSubmission;
      }
      return matchesSearch && matchesType;
    }) || [];

  const stats = {
    total: activities?.length || 0,
    pendientes: isStudent
      ? activities?.filter((a) => !a.user_submission).length || 0
      : 0,
    completadas: isStudent
      ? activities?.filter((a) => a.user_submission).length || 0
      : 0,
    calificadas: isStudent
      ? activities?.filter(
          (a) =>
            a.user_submission?.calificacion !== null &&
            a.user_submission?.calificacion !== undefined,
        ).length || 0
      : 0,
  };

  const getActivityStatus = (activity) => {
    if (isTeacher) {
      return {
        label: activity.habilitada ? "Activa" : "Inactiva",
        classes: activity.habilitada
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      };
    }

    const hasSubmission =
      activity.user_submission !== null &&
      activity.user_submission !== undefined;
    const isGraded =
      activity.user_submission?.calificacion !== null &&
      activity.user_submission?.calificacion !== undefined;

    if (!hasSubmission) {
      return activity.esta_vencida
        ? {
            label: "Vencida",
            classes:
              "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
            icon: XCircleIcon,
          }
        : {
            label: "Pendiente",
            classes:
              "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
            icon: XCircleIcon,
          };
    }
    if (isGraded) {
      return {
        label: "Calificada",
        classes:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        icon: CheckCircleIcon,
        grade: activity.user_submission.calificacion,
      };
    }
    return {
      label: "Entregada",
      classes:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      icon: ClockIcon,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats — solo estudiantes */}
      {isStudent && (
        // Regla 19: NO gradiente — fondo sólido purple-600
        // Regla 17: purple exclusivamente
        <div className="bg-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-sm">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 [text-wrap:balance]">
            Mi Progreso
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { value: stats.total, label: "Total" },
              { value: stats.pendientes, label: "Pendientes" },
              { value: stats.completadas, label: "Completadas" },
              { value: stats.calificadas, label: "Calificadas" },
            ].map(({ value, label }) => (
              <div
                key={label}
                // Regla 18: bg-white/15 sobre purple sólido — explícito y visible en ambos modos
                className="text-center bg-white/15 rounded-xl p-3 sm:p-4"
              >
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums">
                  {value}
                </div>
                <div className="text-xs sm:text-sm text-purple-100 mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      {/* Regla 18: bg-white/dark:bg-gray-900 explícito — nunca bg-gray-800 hardcoded */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-3 sm:p-4 shadow-sm">
        {/* Toggle móvil */}
        <div className="flex items-center justify-between mb-3 sm:hidden">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            Filtros
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-sm active:scale-[0.96]"
          >
            <FunnelIcon className="h-4 w-4" />
            {showFilters ? "Ocultar" : "Filtros"}
          </button>
        </div>

        <div
          className={`${showFilters ? "flex" : "hidden"} sm:flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4`}
        >
          {/* Búsqueda */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            {/* Regla 18: bg-white en light + dark:bg-gray-800 — nunca solo bg-gray-700/50 */}
            <input
              type="text"
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
          </div>

          {/* Filtro estado — solo estudiante */}
          {isStudent && (
            <div className="relative">
              <ListBulletIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors"
              >
                <option value="todas">Todas las actividades</option>
                <option value="pendientes">Pendientes</option>
                <option value="completadas">Completadas</option>
              </select>
            </div>
          )}

          {/* Filtro tipo */}
          <div
            className={`relative ${!isStudent ? "sm:col-span-2 lg:col-span-1" : ""}`}
          >
            <DocumentTextIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors"
            >
              <option value="">Todos los tipos</option>
              <option value="tarea">Tareas</option>
              <option value="examen">Exámenes</option>
              <option value="proyecto">Proyectos</option>
              <option value="quiz">Quizzes</option>
              <option value="exposicion">Exposiciones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cabecera del grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Actividades
        </h2>
        <p className="text-xs sm:text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full tabular-nums">
          {filteredActivities.length}{" "}
          {filteredActivities.length === 1 ? "actividad" : "actividades"}
        </p>
      </div>

      {/* Grid de actividades */}
      {filteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredActivities.map((activity) => {
            const IconComponent =
              TIPO_ICONS[activity.tipo] || ClipboardDocumentCheckIcon;
            const status = getActivityStatus(activity);
            const submission = activity.user_submission;

            return (
              // Regla 18: bg-white/dark:bg-gray-900 — tarjetas siempre opacas
              // Regla 3: shadow en light, border sutil en dark
              <div
                key={activity.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col group"
              >
                {/* Header — purple sólido (Regla 17 + 19) */}
                <div className="bg-purple-600 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Regla 1: concentric radius */}
                      <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-white/80 uppercase tracking-wide truncate">
                        {activity.tipo}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap ${status.classes}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 [text-wrap:balance] min-h-[40px]">
                    {activity.nombre}
                  </h3>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col">
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm line-clamp-3 min-h-[60px] [text-wrap:pretty]">
                    {activity.descripcion || "Sin descripción"}
                  </p>

                  <div className="space-y-2 flex-1">
                    {/* Recompensa — Regla 17: purple, no naranja */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <CurrencyEuroIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Recompensa:</span>
                      </div>
                      <span className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {activity.valor_edubids} EC
                      </span>
                    </div>

                    {/* Valor nota — Regla 17: purple, no azul */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <AcademicCapIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Valor:</span>
                      </div>
                      <span className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {activity.valor_notas} pts
                      </span>
                    </div>

                    {/* Fecha */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Entrega:</span>
                      </div>
                      <span
                        className={`font-medium tabular-nums ${
                          activity.esta_vencida
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {new Date(activity.fecha_entrega).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        )}
                      </span>
                    </div>

                    {/* Tiempo restante */}
                    {activity.tiempo_restante && !activity.esta_vencida && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Tiempo:</span>
                        </div>
                        {/* Regla 17: purple, no naranja */}
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {activity.tiempo_restante}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Calificación — solo estudiante */}
                  {isStudent &&
                    submission?.calificacion !== null &&
                    submission?.calificacion !== undefined && (
                      // Regla 18: fondo explícito en ambos modos
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-xl p-2.5 sm:p-3 mt-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">
                            Tu calificación:
                          </span>
                          <div className="text-right">
                            <span className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400 tabular-nums">
                              {submission.calificacion}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-500 tabular-nums">
                              /{activity.valor_notas}
                            </span>
                          </div>
                        </div>
                        {submission.retroalimentacion && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 line-clamp-2">
                            {submission.retroalimentacion}
                          </p>
                        )}
                      </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  {isStudent ? (
                    <Link
                      to={`/activities/${activity.id}`}
                      // Regla 12: active:scale-[0.96]
                      // Regla 17: purple exclusivo
                      className="block w-full text-center bg-purple-600 text-white px-3 sm:px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-colors font-medium text-xs sm:text-sm active:scale-[0.96]"
                    >
                      {submission ? "Ver Entrega" : "Ver Detalles"}
                    </Link>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        to={`/activities/${activity.id}`}
                        className="flex-1 text-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-2.5 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors font-medium text-xs sm:text-sm active:scale-[0.96]"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => handleEdit(activity)}
                        // Regla 17: editar usa purple, no naranja
                        className="px-3 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center active:scale-[0.96]"
                        title="Editar actividad"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center active:scale-[0.96]"
                        title="Eliminar actividad"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Regla 18: estado vacío con fondo explícito
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm">
          <ClipboardDocumentCheckIcon className="h-12 w-12 sm:h-16 sm:w-16 text-purple-300 dark:text-purple-700 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No se encontraron actividades
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto px-4 [text-wrap:pretty]">
            {searchTerm || typeFilter || statusFilter !== "todas"
              ? "Intenta con otros filtros"
              : isTeacher
                ? "Crea tu primera actividad para empezar"
                : "No hay actividades asignadas aún"}
          </p>
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-purple-700 transition-colors inline-flex items-center gap-2 text-sm sm:text-base shadow-sm active:scale-[0.96]"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Crear Primera Actividad
            </button>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title={editingActivity ? "Editar Actividad" : "Nueva Actividad"}
        size="lg"
      >
        <CreateActivity activity={editingActivity} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default ActivityList;
