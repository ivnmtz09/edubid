import { useState } from "react";
import {
  UsersIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import AdminPatternBg from "../common/patterns/AdminPatternBg";
import { useTheme } from "../../context/useTheme";
import { useAllUsers } from "../../hooks/useUsers";

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const { data: users, isLoading } = useAllUsers();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const mockUsers = users || [];

  const filteredUsers = mockUsers?.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || u.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const roleColors = {
    admin:
      "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50",
    docente:
      "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50",
    estudiante:
      "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50",
  };

  const roleLabels = {
    admin: "Administrador",
    docente: "Docente",
    estudiante: "Estudiante",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 mb-8 shadow-lg transition-colors duration-300 bg-gray-700">
        <AdminPatternBg opacity="opacity-20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">
            ¡Qué bueno verte de nuevo, {user?.first_name}!
          </h1>
          <p className="mt-2 text-white/90">
            Te damos la bienvenida a tu centro de control educativo.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {mockUsers?.length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Usuarios
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {mockUsers?.filter((u) => u.role === "estudiante").length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Estudiantes
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {mockUsers?.filter((u) => u.role === "docente").length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Docentes
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {mockUsers?.filter((u) => u.role === "admin").length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-0">
            Gestión de Usuarios
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos los roles</option>
              <option value="estudiante">Estudiantes</option>
              <option value="docente">Docentes</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mb-4 sm:mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <strong>Nota:</strong> Para gestión completa de usuarios, utiliza el
            Admin de Django.
          </p>
        </div>

        {/* Users List */}
        <div className="space-y-2 sm:space-y-3">
          {filteredUsers?.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                  {u.first_name?.charAt(0)}
                  {u.last_name?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {u.first_name} {u.last_name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {u.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}
                    >
                      {roleLabels[u.role]}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 hidden sm:inline">
                      ID: {u.id}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <a
                  href={`http://localhost:8000/admin/users/user/${u.id}/change/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                  title="Editar en Django Admin"
                >
                  <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-gray-100 dark:bg-gray-700 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              No se encontraron usuarios
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
