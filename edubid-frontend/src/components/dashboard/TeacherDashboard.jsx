import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
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
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: activities, isLoading: activitiesLoading } = useActivities();

  if (classroomsLoading || groupsLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalStudents =
    classrooms?.reduce((acc, c) => acc + (c.estudiantes_count || 0), 0) || 0;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 mb-8 shadow-lg transition-colors duration-300 bg-blue-600">
        <TeacherPatternBg opacity="opacity-20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white text-wrap-balance">
            ¡Qué bueno verte de nuevo, {user?.first_name}!
          </h1>
          <p className="mt-2 text-white/90">
            Te damos la bienvenida a tu centro de control educativo.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Clases",
            count: classrooms?.length || 0,
            icon: AcademicCapIcon,
            color: "yellow",
          },
          {
            label: "Grupos",
            count: groups?.length || 0,
            icon: UserGroupIcon,
            color: "blue",
          },
          {
            label: "Actividades",
            count: activities?.length || 0,
            icon: ClipboardDocumentListIcon,
            color: "purple",
          },
          {
            label: "Estudiantes",
            count: totalStudents,
            icon: UsersIcon,
            color: "orange",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-md dark:shadow-gray-900/50"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className={`p-1.5 sm:p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg`}
              >
                <stat.icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}-600 dark:text-${stat.color}-400`}
                />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {stat.count}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            to: "/classrooms",
            color: "yellow",
            title: "Nueva Clase",
            desc: "Crea una nueva clase",
            icon: PlusIcon,
          },
          {
            to: "/groups",
            color: "blue",
            title: "Nuevo Grupo",
            desc: "Organiza a tus estudiantes",
            icon: PlusIcon,
          },
          {
            to: "/activities",
            color: "purple",
            title: "Nueva Actividad",
            desc: "Asigna tareas y exámenes",
            icon: PlusIcon,
          },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group bg-white dark:bg-gray-900 rounded-xl p-5 sm:p-6 shadow-md dark:shadow-gray-900/50 border-2 border-transparent hover:border-dashed hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 active:scale-[0.96]"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div
                className={`p-3 bg-${action.color}-600 rounded-xl text-white group-hover:scale-105 transition-transform duration-200`}
              >
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                  {action.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {action.desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Classes & Activities */}
        {[
          {
            title: "Mis Clases",
            to: "/classrooms",
            data: classrooms,
            icon: AcademicCapIcon,
            color: "yellow",
            empty: "No tienes clases creadas aún",
          },
          {
            title: "Actividades Recientes",
            to: "/activities",
            data: activities,
            icon: ClipboardDocumentListIcon,
            color: "purple",
            empty: "No has creado actividades aún",
          },
        ].map((section) => (
          <div
            key={section.title}
            className="bg-white dark:bg-gray-900 rounded-xl p-5 sm:p-6 shadow-md dark:shadow-gray-900/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-wrap-balance">
                {section.title}
              </h2>
              <Link
                to={section.to}
                className={`text-${section.color}-600 hover:text-${section.color}-700 text-sm font-medium flex items-center space-x-1`}
              >
                <span>Ver todas</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            {section.data && section.data.length > 0 ? (
              <div className="space-y-3">
                {section.data.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`${section.to}/${item.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-white/10 group-hover:border-gray-300">
                        <section.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {item.nombre}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                          {item.estudiantes_count ||
                            item.submissions?.length ||
                            0}{" "}
                          items
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <section.icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {section.empty}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
