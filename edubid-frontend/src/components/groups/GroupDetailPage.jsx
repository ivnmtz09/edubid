import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  UserIcon,
  EnvelopeIcon,
  ClockIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useActivities } from "../../hooks/useActivities";
import api from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EditGroupModal from "./EditGroupModal";

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [copied, setCopied] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const isTeacher = user?.role === "docente";
  const isStudent = user?.role === "estudiante";

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/groups/${id}/`);
        return res.data;
      } catch (error) {
        console.error("Error cargando grupo:", error);
        throw error;
      }
    },
  });

  const { data: activities = [], isLoading: loadingActivities } = useActivities(
    { group: id },
  );

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyCode = () => {
    if (group?.codigo) {
      navigator.clipboard.writeText(group.codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEdit = () => {
    setEditingGroup(group);
  };

  const handleCloseEdit = () => {
    setEditingGroup(null);
  };

  const isCodeExpired = () => {
    if (!group?.codigo_expira_en) return false;
    return new Date() > new Date(group.codigo_expira_en);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-transparent">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
            Cargando información del grupo...
          </p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-[400px] bg-transparent flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <UserGroupIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Grupo no encontrado
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            El grupo que buscas no existe o no tienes acceso.
          </p>
          <button
            onClick={() => navigate("/groups")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium text-sm active:scale-[0.96]"
          >
            Volver a Grupos
          </button>
        </div>
      </div>
    );
  }

  const estudiantes = group.estudiantes_detail || [];
  const classroom = group.classroom_detail || group.classroom || {};

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => navigate("/groups")}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm sm:text-base"
          >
            <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Volver a Grupos</span>
          </button>

          {isTeacher && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm active:scale-[0.96]"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Editar Grupo</span>
              <span className="sm:hidden">Editar</span>
            </button>
          )}
        </div>

        {/* Header Card — azul sólido */}
        <div className="bg-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold line-clamp-2">
                  {group.nombre}
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base line-clamp-1">
                  Clase: {classroom.nombre || "No asignada"}
                </p>
              </div>
            </div>

            {isTeacher && group.codigo && (
              <div className="bg-white/15 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-blue-100">
                    Código de Acceso
                  </p>
                  {isCodeExpired() && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Expirado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-2 bg-white/20 px-3 sm:px-4 py-2 rounded-lg flex-1 min-w-0">
                    <DocumentDuplicateIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-white" />
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wider truncate text-white">
                      {group.codigo}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    disabled={isCodeExpired()}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title={isCodeExpired() ? "Código expirado" : "Copiar código"}
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                    ) : (
                      <DocumentDuplicateIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1">
                  <p className="text-xs text-blue-200">
                    Comparte este código con tus estudiantes
                  </p>
                  {group.codigo_expira_en && (
                    <p className="text-xs text-blue-200 text-right sm:text-left">
                      Expira: {formatDateTime(group.codigo_expira_en)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Descripción */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              Descripción
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
              {group.descripcion || "Sin descripción disponible"}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              Estadísticas
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Estudiantes:
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg tabular-nums">
                  {group.estudiantes_count || estudiantes.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Estado:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    group.activo
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {group.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Creado:
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-sm tabular-nums">
                  {formatDate(group.creado)}
                </span>
              </div>
            </div>
          </div>

          {/* Clase */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              Información de Clase
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Clase asignada:
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2">
                  {classroom.nombre || "No asignada"}
                </p>
              </div>
              {classroom.descripcion && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Descripción:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {classroom.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estudiantes Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              Estudiantes <span className="tabular-nums">({estudiantes.length})</span>
            </h2>
            {estudiantes.length > 0 && (
              <div className="text-sm bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-semibold">
                {estudiantes.length} estudiante
                {estudiantes.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {estudiantes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
              {estudiantes.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200/50 dark:border-blue-500/20 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {(student.first_name?.[0] || "U") +
                      (student.last_name?.[0] || "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm truncate flex items-center gap-1">
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">
                        {student.first_name} {student.last_name}
                      </span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate flex items-center gap-1 mt-1">
                      <EnvelopeIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200/50 dark:border-blue-500/20">
              <UserGroupIcon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400 dark:text-blue-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
                No hay estudiantes aún
              </h3>
              <p className="text-blue-600 dark:text-blue-400 text-sm sm:text-base max-w-md mx-auto px-4">
                {isTeacher
                  ? "Los estudiantes aparecerán aquí cuando se unan con el código de acceso"
                  : "Espera a que más compañeros se unan al grupo"}
              </p>
              {isTeacher && group.codigo && !isCodeExpired() && (
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200/50 dark:border-blue-500/20 max-w-md mx-auto">
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    Comparte el código{" "}
                    <strong className="text-blue-800 dark:text-blue-400 font-mono">
                      {group.codigo}
                    </strong>{" "}
                    con tus estudiantes
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actividades del Grupo — Purple (Módulo Actividades) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              Actividades del Grupo
              {activities.length > 0 && (
                <span className="text-sm bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-semibold tabular-nums">
                  {activities.length}
                </span>
              )}
            </h2>
            {isTeacher && (
              <button
                onClick={() => navigate("/activities")}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold text-sm sm:text-base flex items-center gap-1"
              >
                <span>Gestionar actividades</span>
                <ArrowLeftIcon className="h-4 w-4 transform rotate-180" />
              </button>
            )}
          </div>

          {loadingActivities ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : activities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity) => {
                const isVencida = activity.esta_vencida;
                const hasSubmission = activity.user_submission != null;
                const isCalificada =
                  hasSubmission &&
                  activity.user_submission?.calificacion != null;

                return (
                  <Link
                    key={activity.id}
                    to={`/activities/${activity.id}`}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] overflow-hidden flex flex-col group"
                  >
                    {/* Card Header — purple sólido */}
                    <div className="bg-purple-600 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white/80 uppercase">
                          {activity.tipo}
                        </span>
                        {isTeacher ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.habilitada
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {activity.habilitada ? "Activa" : "Inactiva"}
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isCalificada
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : hasSubmission
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                  : isVencida
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            }`}
                          >
                            {isCalificada
                              ? "Calificada"
                              : hasSubmission
                                ? "Entregada"
                                : isVencida
                                  ? "Vencida"
                                  : "Pendiente"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm line-clamp-2">
                        {activity.nombre}
                      </h3>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-2 flex-1">
                      <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                        {activity.descripcion || "Sin descripción"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          <span>
                            {new Date(
                              activity.fecha_entrega,
                            ).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {/* EduBids: purple, no naranja */}
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                          <CurrencyEuroIcon className="h-3.5 w-3.5" />
                          <span>{activity.valor_edubids} EC</span>
                        </div>
                      </div>
                      {isStudent && isCalificada && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-2 flex items-center justify-between">
                          <span className="text-xs text-green-700 dark:text-green-400">
                            Tu nota:
                          </span>
                          <span className="font-bold text-green-700 dark:text-green-400 text-sm">
                            {activity.user_submission.calificacion}/
                            {activity.valor_notas}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20">
              <ClipboardDocumentListIcon className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 dark:text-purple-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-purple-700 dark:text-purple-400 mb-2">
                No hay actividades asignadas
              </h3>
              <p className="text-purple-600 dark:text-purple-400 text-sm sm:text-base mb-4 max-w-md mx-auto px-4">
                Las actividades asignadas a este grupo aparecerán aquí
              </p>
              {isTeacher && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate("/activities")}
                    className="bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition font-medium text-sm sm:text-base active:scale-[0.96]"
                  >
                    Crear actividad
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info bar móvil */}
        <div className="lg:hidden mt-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
            <ClockIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-semibold">Información del grupo</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            Creado el {formatDateTime(group.creado)} • {estudiantes.length}{" "}
            estudiante{estudiantes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {editingGroup && (
        <EditGroupModal group={editingGroup} onClose={handleCloseEdit} />
      )}
    </div>
  );
};

export default GroupDetailPage;
