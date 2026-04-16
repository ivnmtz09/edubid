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
  ClockIcon as ClockSolidIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  QuestionMarkCircleIcon
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../common/LoadingSpinner";
import Modal from "../common/Modal";
import CreateActivity from "./CreateActivity";

const ActivityList = () => {
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

  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch =
      activity.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || activity.tipo === typeFilter;

    if (isStudent) {
      const hasSubmission = activity.user_submission !== null && activity.user_submission !== undefined;
      
      if (statusFilter === "pendientes") {
        return matchesSearch && matchesType && !hasSubmission;
      } else if (statusFilter === "completadas") {
        return matchesSearch && matchesType && hasSubmission;
      }
    }

    return matchesSearch && matchesType;
  }) || [];

  const stats = {
    total: activities?.length || 0,
    pendientes: isStudent 
      ? activities?.filter(a => !a.user_submission).length || 0
      : 0,
    completadas: isStudent
      ? activities?.filter(a => a.user_submission).length || 0
      : 0,
    calificadas: isStudent
      ? activities?.filter(a => a.user_submission?.calificacion !== null && a.user_submission?.calificacion !== undefined).length || 0
      : 0
  };

  const getActivityIcon = (tipo) => {
    const icons = {
      tarea: ClipboardDocumentCheckIcon,
      examen: AcademicCapIcon,
      proyecto: CheckCircleIcon,
      quiz: ClockIcon,
      exposicion: CalendarIcon
    };
    return icons[tipo] || ClipboardDocumentCheckIcon;
  };

  const getActivityStatus = (activity) => {
    if (isStudent) {
      const hasSubmission = activity.user_submission !== null && activity.user_submission !== undefined;
      
      if (!hasSubmission) {
        return {
          label: activity.esta_vencida ? "Vencida" : "Pendiente",
          color: activity.esta_vencida ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700",
          icon: XCircleIcon
        };
      }
      
      if (activity.user_submission?.calificacion !== null && activity.user_submission?.calificacion !== undefined) {
        return {
          label: "Calificada",
          color: "bg-green-100 text-green-700",
          icon: CheckCircleIcon,
          grade: activity.user_submission.calificacion
        };
      }
      
      return {
        label: "Entregada",
        color: "bg-blue-100 text-blue-700",
        icon: ClockIcon
      };
    }
    
    return {
      label: activity.habilitada ? "Activa" : "Inactiva",
      color: activity.habilitada ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
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
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Actividades Asignadas
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base mt-1">
            {isTeacher ? "Gestiona las actividades de tus grupos" : "Consulta tus actividades, entrega tus trabajos y revisa tus calificaciones."}
          </p>
        </div>
        {isTeacher && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto touch-manipulation shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Nueva Actividad</span>
          </button>
        )}
      </div>

      {/* Stats - Solo para estudiantes */}
      {isStudent && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Mi Progreso</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.total}</div>
              <div className="text-xs sm:text-sm text-purple-100 mt-1">Total</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.pendientes}</div>
              <div className="text-xs sm:text-sm text-purple-100 mt-1">Pendientes</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.completadas}</div>
              <div className="text-xs sm:text-sm text-purple-100 mt-1">Completadas</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.calificadas}</div>
              <div className="text-xs sm:text-sm text-purple-100 mt-1">Calificadas</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between mb-3 sm:hidden">
          <h3 className="font-semibold text-gray-900 text-sm">Filtros</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-xl hover:bg-purple-100 transition-all duration-300 text-sm touch-manipulation"
          >
            <FunnelIcon className="h-4 w-4" />
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 transition-all duration-500 ease-in-out`}>
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-purple-400 transition-colors duration-300" />
            <input
              type="text"
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base bg-white/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-300 hover:bg-white"
            />
          </div>

          {/* Status Filter - Solo estudiantes */}
          {isStudent && (
            <div className="relative">
              <ListBulletIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-purple-400 transition-colors duration-300" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base bg-white/50 backdrop-blur-sm appearance-none transition-all duration-300 hover:border-purple-300 hover:bg-white cursor-pointer"
              >
                <option value="todas">
                  Todas las actividades
                </option>
                <option value="pendientes">
                  Pendientes de entrega
                </option>
                <option value="completadas">
                  Completadas
                </option>
              </select>
            </div>
          )}

          {/* Type Filter */}
          <div className="relative">
            <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-purple-400 transition-colors duration-300" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base bg-white/50 backdrop-blur-sm appearance-none transition-all duration-300 hover:border-purple-300 hover:bg-white cursor-pointer ${!isStudent ? 'sm:col-span-2 lg:col-span-1' : ''}`}
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

      {/* Activities Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Actividades</h2>
          <p className="text-xs sm:text-sm text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'actividad' : 'actividades'}
          </p>
        </div>
        
        {filteredActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {filteredActivities.map((activity) => {
              const IconComponent = getActivityIcon(activity.tipo);
              const status = getActivityStatus(activity);
              const submission = activity.user_submission;

              return (
                <div
                  key={activity.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden flex flex-col group"
                >
                  {/* Header - Purple Theme */}
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 sm:p-5 border-b border-purple-200">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0 group-hover:bg-white/30 transition-all duration-300">
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-white/90 uppercase truncate">
                          {activity.tipo}
                        </span>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${status.color} backdrop-blur-sm transition-all duration-300`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base lg:text-lg line-clamp-2 break-words min-h-[40px] sm:min-h-[48px] group-hover:text-white/95 transition-colors duration-300">
                      {activity.nombre}
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col">
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-3 min-h-[60px] break-words group-hover:text-gray-700 transition-colors duration-300">
                      {activity.descripcion || "Sin descripción"}
                    </p>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          <CurrencyEuroIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>Recompensa:</span>
                        </div>
                        <span className="font-bold text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                          {activity.valor_educoins} EC
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          <AcademicCapIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>Valor:</span>
                        </div>
                        <span className="font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                          {activity.valor_notas} pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>Entrega:</span>
                        </div>
                        <span className={`font-medium ${
                          activity.esta_vencida ? "text-red-600 group-hover:text-red-700" : "text-gray-900 group-hover:text-gray-950"
                        } transition-colors duration-300`}>
                          {new Date(activity.fecha_entrega).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short"
                          })}
                        </span>
                      </div>

                      {activity.tiempo_restante && !activity.esta_vencida && (
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                            <ClockSolidIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>Tiempo:</span>
                          </div>
                          <span className="font-medium text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                            {activity.tiempo_restante}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Grade Display */}
                    {isStudent && submission?.calificacion !== null && submission?.calificacion !== undefined && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-2 sm:p-3 mt-auto group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-green-700">
                            Tu calificación:
                          </span>
                          <div className="text-right">
                            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">
                              {submission.calificacion}
                            </span>
                            <span className="text-xs sm:text-sm text-green-600">
                              /{activity.valor_notas}
                            </span>
                          </div>
                        </div>
                        {submission.retroalimentacion && (
                          <p className="text-xs text-green-600 mt-1 sm:mt-2 line-clamp-2 break-words">
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
                        className="block w-full text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-xs sm:text-sm lg:text-base touch-manipulation shadow-lg hover:shadow-xl"
                      >
                        {submission ? "Ver Entrega" : "Ver Detalles"}
                      </Link>
                    ) : (
                      <div className="flex gap-2">
                        <Link
                          to={`/activities/${activity.id}`}
                          className="flex-1 text-center bg-purple-50 text-purple-600 px-3 py-2 sm:py-2.5 rounded-xl hover:bg-purple-100 hover:text-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-xs sm:text-sm touch-manipulation"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => handleEdit(activity)}
                          className="px-3 py-2 sm:py-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 hover:text-orange-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center touch-manipulation"
                          title="Editar actividad"
                        >
                          <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="px-3 py-2 sm:py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center touch-manipulation"
                          title="Eliminar actividad"
                        >
                          <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100">
            <ClipboardDocumentCheckIcon className="h-12 w-12 sm:h-16 sm:w-16 text-purple-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              No se encontraron actividades
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 max-w-md mx-auto px-4">
              {searchTerm || typeFilter || statusFilter !== "todas"
                ? "Intenta con otros filtros"
                : isTeacher
                ? "Crea tu primera actividad para empezar"
                : "No hay actividades asignadas aún"}
            </p>
            {isTeacher && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2 text-sm sm:text-base touch-manipulation shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Crear Primera Actividad
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title={editingActivity ? "Editar Actividad" : "Nueva Actividad"}
        size="lg"
      >
        <CreateActivity 
          activity={editingActivity} 
          onClose={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};

export default ActivityList;