import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CurrencyEuroIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useActivities } from "../../hooks/useActivities";
import { useGroups } from "../../hooks/useGroups";
import { useAuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import StudentPatternBg from "../common/patterns/StudentPatternBg";
import { useTheme } from "../../context/useTheme";
import { useTotalBalance } from "../../hooks/useWallet";

export default function StudentDashboard() {
  const { user } = useAuthContext();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: totalBalance, isLoading: balanceLoading } = useTotalBalance();

  const pendingActivities = activities?.filter((a) => !a.user_submission) || [];
  const completedActivities = activities?.filter((a) => a.user_submission) || [];

  if (activitiesLoading || groupsLoading || balanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 mb-8 shadow-lg transition-colors duration-300 bg-orange-600">
        <StudentPatternBg opacity="opacity-20" />
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
          { label: "Grupos", count: groups?.length || 0, icon: UserGroupIcon, color: "blue" },
          { label: "Pendientes", count: pendingActivities.length, icon: ClockIcon, color: "red" },
          { label: "Completadas", count: completedActivities.length, icon: TrophyIcon, color: "green" },
          { label: "edubids", count: totalBalance || 0, icon: CurrencyEuroIcon, color: "orange", isMoney: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-md dark:shadow-gray-900/50">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-1.5 sm:p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div>
                <p className={`text-lg sm:text-2xl font-bold ${stat.isMoney ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'} tabular-nums`}>
                  {stat.count}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {[
          { to: "/activities", color: "purple", title: "Ver Actividades", desc: `${pendingActivities.length} pendientes`, icon: ClipboardDocumentListIcon },
          { to: "/groups", color: "blue", title: "Mis Grupos", desc: "Gestiona tus grupos y clases", icon: AcademicCapIcon },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group bg-white dark:bg-gray-900 rounded-xl p-5 sm:p-6 shadow-md dark:shadow-gray-900/50 transition-all duration-200 active:scale-[0.96]"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 bg-${action.color}-600 rounded-xl text-white group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 tabular-nums">
                  {action.desc}
                </p>
                <div className={`flex items-center text-${action.color}-600 dark:text-${action.color}-400 text-sm font-medium`}>
                  <span>Ver todas</span>
                  <ArrowRightIcon className="h-4 w-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 sm:p-6 shadow-md dark:shadow-gray-900/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-wrap-balance">
            Actividades Recientes
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full tabular-nums">
            {pendingActivities.length} pendientes
          </span>
        </div>

        {pendingActivities.length > 0 ? (
          <div className="space-y-3">
            {pendingActivities.slice(0, 5).map((activity) => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group active:scale-[0.98]"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-white/10 group-hover:border-gray-300">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {activity.nombre}
                    </h4>
                    <div className="flex items-center space-x-1 mt-1">
                      <ClockIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Vence: {new Date(activity.fecha_entrega).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-medium tabular-nums">
                    {activity.valor_edubids} EC
                  </span>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrophyIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay actividades pendientes
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              ¡Buen trabajo! Has completado todas las actividades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
