import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  useClassrooms,
  useCreateClassroom,
  useDeleteClassroom,
} from "../../hooks/useClassrooms";
import { useAuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import Modal from "../common/Modal";
import ClassroomCard from "./ClassroomCard";

export default function ClassroomList() {
  const { user } = useAuthContext();
  const { data: classrooms, isLoading, refetch } = useClassrooms();
  const createMutation = useCreateClassroom();
  const deleteMutation = useDeleteClassroom();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  const isTeacher = user?.role === "docente";

  const filteredClassrooms =
    classrooms?.filter(
      (c) =>
        c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const stats = {
    total: classrooms?.length || 0,
    totalStudents:
      classrooms?.reduce((sum, c) => sum + (c.estudiantes_count || 0), 0) || 0,
    totalGroups:
      classrooms?.reduce((sum, c) => sum + (c.grupos_clases?.length || 0), 0) ||
      0,
    recent:
      classrooms?.filter((c) => {
        const created = new Date(c.creado);
        const now = new Date();
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        return diffDays < 7;
      }).length || 0,
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    try {
      await createMutation.mutateAsync(formData);
      setShowCreateModal(false);
      setFormData({ nombre: "", descripcion: "" });
      refetch();
    } catch (error) {
      console.error("Error creando clase:", error);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "¿Estás seguro de eliminar esta clase? Esta acción no se puede deshacer.",
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error eliminando clase:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-transparent">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex-shrink-0">
            <AcademicCapIcon className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-wrap-balance">
              Mis Clases
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              {isTeacher
                ? "Gestiona tus clases, grupos y estudiantes"
                : "Clases en las que estás inscrito"}
            </p>
          </div>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-yellow-600 text-white px-5 py-3 rounded-xl hover:bg-yellow-700 shadow-sm transition-all duration-200 font-medium w-full lg:w-auto active:scale-[0.96]"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Crear nueva clase</span>
          </button>
        )}
      </div>

      {/* Stats */}
      {isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Clases",
              count: stats.total,
              icon: AcademicCapIcon,
              color: "yellow",
            },
            {
              label: "Estudiantes",
              count: stats.totalStudents,
              icon: UserGroupIcon,
              color: "blue",
            },
            {
              label: "Grupos",
              count: stats.totalGroups,
              icon: AcademicCapIcon,
              color: "green",
            },
            {
              label: "Recientes",
              count: stats.recent,
              icon: CalendarIcon,
              color: "purple",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${stat.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {stat.count}
                  </p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clases por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none transition-all duration-200 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Classrooms Grid */}
      {filteredClassrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} onDelete={isTeacher ? handleDelete : null} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/5">
          <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm
              ? "No se encontraron clases"
              : "No hay clases disponibles"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto px-4 text-sm">
            {searchTerm
              ? "Intenta con otros términos de búsqueda"
              : isTeacher
                ? "Comienza creando tu primera clase para organizar a tus estudiantes"
                : "Espera a que tu docente te agregue a una clase"}
          </p>
          {isTeacher && !searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-600 text-white px-6 py-3 rounded-xl hover:bg-yellow-700 transition-all duration-200 font-medium shadow-sm active:scale-[0.96]"
            >
              Crear primera clase
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Clase"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Clase *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none transition-all duration-200 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              placeholder="Ej: Matemáticas 10°A - 2024"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-2 tabular-nums">
              {formData.nombre.length}/100 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none transition-all duration-200 resize-none text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              placeholder="Describe brevemente el contenido, objetivos o información importante de la clase..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-2 tabular-nums">
              {formData.descripcion.length}/500 caracteres
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-900/30">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-400 text-sm mb-2">
              Información importante
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              <li>• Podrás crear grupos dentro de esta clase</li>
              <li>• Los estudiantes se unirán a través de códigos de grupo</li>
              <li>• Podrás asignar actividades a grupos específicos</li>
              <li>• Gestionarás edubids y calificaciones por clase</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm active:scale-[0.96]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !formData.nombre.trim()}
              className="flex-1 bg-yellow-600 text-white px-4 py-3 rounded-xl hover:bg-yellow-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-[0.96]"
            >
              {createMutation.isPending ? "Creando..." : "Crear Clase"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
