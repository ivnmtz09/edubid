"use client"
import { useState } from "react"
import { useGroups } from "../../hooks/useGroups"
import { useAuthContext } from "../../context/AuthContext"
import JoinGroupCard from "../../components/groups/JoinGroupCard"
import GroupList from "../../components/groups/GroupList"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import CreateGroup from "../../components/groups/CreateGroup"
import { UserGroupIcon, PlusIcon } from "@heroicons/react/24/outline"

export default function GroupsPage() {
  const { user } = useAuthContext()
  const { data: groups, isLoading, error } = useGroups()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const isStudent = user?.role === "estudiante"
  const isTeacher = user?.role === "docente"

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4 text-sm sm:text-base">Cargando grupos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-md mx-auto">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar grupos</h2>
          <p className="text-gray-600 mb-6 text-sm">Intenta recargar la página</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
          >
            Recargar página
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Grupos</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1 max-w-2xl">
            {isTeacher 
              ? "Gestiona y organiza a tus estudiantes en grupos de aprendizaje" 
              : "Accede a tus grupos de estudio y colabora con tus compañeros"
            }
          </p>
        </div>
        
        {isTeacher && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base w-full sm:w-auto shadow-sm hover:shadow-md"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Nuevo Grupo
          </button>
        )}
      </div>

      {/* Join Group Card for Students */}
      {isStudent && <JoinGroupCard />}

      {/* Groups Content */}
      {isTeacher ? (
        <GroupList />
      ) : (
        <>
          {groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
                  onClick={() => window.location.href = `/groups/${group.id}`}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-gray-900 text-base sm:text-lg group-hover:text-blue-700 transition-colors truncate">
                          {group.nombre}
                        </h2>
                        <p className="text-blue-600 text-xs sm:text-sm font-medium mt-1 truncate">
                          Clase: {group.classroom_nombre || 
                                 group.classroom_detail?.nombre || 
                                 group.classroom?.nombre || 
                                 "Sin clase asignada"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        group.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {group.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-2 min-h-[40px]">
                    {group.descripcion || "Sin descripción disponible"}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>
                        <span className="font-medium">{group.estudiantes_count || group.estudiantes?.length || 0}</span> estudiantes
                      </span>
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(group.creado).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-gray-200">
              <UserGroupIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {isStudent ? "Aún no estás en ningún grupo" : "No hay grupos creados"}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto mb-6">
                {isStudent 
                  ? "Usa el código de acceso que te proporcionó tu profesor para unirte a un grupo"
                  : "Crea tu primer grupo para organizar a tus estudiantes y asignar actividades"
                }
              </p>
              {isStudent ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>¿Cómo unirte?</strong> Pídele a tu profesor el código de acceso del grupo
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm sm:text-base"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Crear mi primer grupo
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroup onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}