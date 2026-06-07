import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  PlusIcon,
  UsersIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useClassrooms } from "../../hooks/useClassrooms";
import { useGroups } from "../../hooks/useGroups";
import { useActivities } from "../../hooks/useActivities";
import { useAuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import TeacherPatternBg from "../common/patterns/TeacherPatternBg";
import { useTheme } from "../../context/useTheme";

export default function TeacherDashboard() {
  const { user } = useAuthContext();
  const { data: classrooms, isLoading: classroomsLoading } = useClassrooms();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: activities, isLoading: activitiesLoading } = useActivities();

  if (classroomsLoading || groupsLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalStudents =
    classrooms?.reduce((acc, c) => acc + (c.estudiantes_count || 0), 0) || 0;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 mb-8 shadow-lg transition-colors duration-300 bg-blue-600">
        <TeacherPatternBg opacity="opacity-20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">
            ¡Qué bueno verte de nuevo, {user?.first_name}!
          </h1>
          <p className="mt-2 text-white/90">
            Te damos la bienvenida a tu centro de control educativo.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {classrooms?.length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Clases</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {groups?.length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Grupos</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ClipboardDocumentListIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {activities?.length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Actividades
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
                {totalStudents}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Estudiantes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Link
          to="/classrooms"
          className="group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-yellow-500 hover:shadow-md transition-all duration-200"
        >
          <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
            <div className="p-2 sm:p-3 bg-yellow-600 rounded-xl text-white group-hover:scale-105 transition-transform duration-200">
              <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                Nueva Clase
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Crea una nueva clase
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/groups"
          className="group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:shadow-md transition-all duration-200"
        >
          <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
            <div className="p-2 sm:p-3 bg-blue-600 rounded-xl text-white group-hover:scale-105 transition-transform duration-200">
              <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                Nuevo Grupo
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Organiza a tus estudiantes
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/activities"
          className="group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-purple-500 hover:shadow-md transition-all duration-200"
        >
          <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
            <div className="p-2 sm:p-3 bg-purple-600 rounded-xl text-white group-hover:scale-105 transition-transform duration-200">
              <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                Nueva Actividad
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Asigna tareas y exámenes
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Classes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Mis Clases
            </h2>
            <Link
              to="/classrooms"
              className="text-yellow-600 hover:text-yellow-700 text-xs sm:text-sm font-medium flex items-center space-x-1"
            >
              <span>Ver todas</span>
              <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>
          {classrooms && classrooms.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {classrooms.slice(0, 3).map((classroom) => (
                <Link
                  key={classroom.id}
                  to={`/classrooms/${classroom.id}`}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border border-gray-100 dark:border-gray-600 hover:border-yellow-200 dark:hover:border-yellow-800/50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 group-hover:border-yellow-300">
                      <AcademicCapIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-300 group-hover:text-yellow-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-yellow-700 dark:group-hover:text-yellow-400 truncate">
                        {classroom.nombre}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {classroom.estudiantes_count || 0} estudiantes
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 group-hover:text-yellow-500 transform group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="bg-gray-100 dark:bg-gray-700 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                No tienes clases creadas aún
              </p>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Actividades Recientes
            </h2>
            <Link
              to="/activities"
              className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium flex items-center space-x-1"
            >
              <span>Ver todas</span>
              <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>
          {activities && activities.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <Link
                  key={activity.id}
                  to={`/activities/${activity.id}`}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-100 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-800/50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 group-hover:border-purple-300 flex-shrink-0">
                      <ClipboardDocumentListIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-300 group-hover:text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-purple-700 dark:group-hover:text-purple-400 truncate">
                        {activity.nombre}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.submissions?.length || 0} entregas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                    <span className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium hidden sm:block">
                      {activity.tipo}
                    </span>
                    <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="bg-gray-100 dark:bg-gray-700 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ClipboardDocumentListIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                No has creado actividades aún
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
