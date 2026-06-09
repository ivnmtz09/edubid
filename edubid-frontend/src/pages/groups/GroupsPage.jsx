"use client";
import { useState } from "react";
import { useGroups } from "../../hooks/useGroups";
import { useAuthContext } from "../../context/AuthContext";
import JoinGroupCard from "../../components/groups/JoinGroupCard";
import GroupCard from "../../components/groups/GroupCard";
import GroupList from "../../components/groups/GroupList";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CreateGroup from "../../components/groups/CreateGroup";
import { UserGroupIcon, PlusIcon } from "@heroicons/react/24/outline";

// Layout provee: bg-gray-50 dark:bg-gray-950, py-6, max-w-7xl, px-4 sm:px-6 lg:px-8
// Aquí NO duplicamos padding ni colores de fondo (nested canvas fix)
export default function GroupsPage() {
  const { user } = useAuthContext();
  const { data: groups, isLoading, error } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isStudent = user?.role === "estudiante";
  const isTeacher = user?.role === "docente";

  if (isLoading) {
    return (
      <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
            Cargando grupos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300 flex items-center justify-center min-h-[300px]">
        <div className="text-center max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <UserGroupIcon className="h-16 w-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Error al cargar grupos
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Intenta recargar la página
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm active:scale-[0.96]"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300 space-y-6">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white [text-wrap:balance]">
            {isTeacher ? "Gestión de Grupos" : "Mis Grupos"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-1 max-w-2xl [text-wrap:pretty]">
            {isTeacher
              ? "Organiza a tus estudiantes en grupos de aprendizaje para facilitar la colaboración y el seguimiento."
              : "Accede a tus grupos de estudio, colabora con tus compañeros y revisa los detalles de cada uno."}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm w-full sm:w-auto shadow-sm hover:shadow-md active:scale-[0.96]"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Nuevo Grupo
          </button>
        )}
      </div>

      {/* ── Join Card (solo estudiante) ───────────────────── */}
      {isStudent && <JoinGroupCard />}

      {/* ── Groups Content ────────────────────────────────── */}
      {isTeacher ? (
        /* Docente: usa GroupList (incluye CRUD completo) */
        <GroupList />
      ) : (
        /* Estudiante: vista de sus grupos con GroupCard en modo lectura */
        <>
          {groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  role="estudiante"
                  onDelete={() => {}}
                  onEdit={() => {}}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl w-fit mx-auto mb-4">
                <UserGroupIcon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aún no estás en ningún grupo
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-6 [text-wrap:pretty]">
                Usa el código de acceso que te proporcionó tu profesor para unirte a un grupo.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 max-w-sm mx-auto">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>¿Cómo unirte?</strong> Pídele a tu profesor el código de acceso del grupo.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal Crear Grupo ─────────────────────────────── */}
      {showCreateModal && (
        <CreateGroup onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
