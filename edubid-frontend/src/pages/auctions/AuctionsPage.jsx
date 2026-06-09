import React, { useState } from "react";
import AuctionList from "../../components/auctions/AuctionList";
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  CurrencyEuroIcon,
  BanknotesIcon,
  TrophyIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useAuthContext } from "../../context/AuthContext";
import { useWallet } from "../../hooks/useWallet";
import { useAuctions } from "../../hooks/useAuctions";
import { USER_ROLES } from "../../utils/constants";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Error caught in ErrorBoundary:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Ocurrio un error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No se pudieron cargar las subastas. Intenta recargar la lista.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 font-medium shadow-sm active:scale-[0.96]"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Reintentar
            </button>
            
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium active:scale-[0.96]"
            >
              Recargar pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AuctionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuthContext();
  const { data: walletData, isLoading: walletLoading } = useWallet();
  const { data: auctions } = useAuctions();
  
  const isStudent = user?.role === USER_ROLES.STUDENT;
  const isTeacher = user?.role === USER_ROLES.TEACHER;

  const handleReset = () => {
    setRefreshKey((k) => k + 1);
  };

  const auctionsArray = Array.isArray(auctions) ? auctions : [];
  
  const stats = {
    total: auctionsArray.length,
    active: auctionsArray.filter(a => a.estado === 'active').length,
    closed: auctionsArray.filter(a => a.estado === 'closed').length,
    totalBids: auctionsArray.reduce((sum, auction) => sum + (auction.total_pujas || 0), 0),
    totalStudents: new Set(
      auctionsArray.flatMap(auction => 
        auction.bids?.map(bid => bid.estudiante?.id) || []
      )
    ).size,
    totalCoins: auctionsArray.reduce((sum, auction) => {
      const highestBid = auction.bids?.reduce((max, bid) => 
        bid.cantidad > max ? bid.cantidad : max, 0
      ) || 0;
      return sum + highestBid;
    }, 0)
  };

  return (
    <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-600 rounded-xl">
                <BanknotesIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Subastas Academicas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                  {isTeacher 
                    ? "Crea subastas motivadoras para tus estudiantes" 
                    : "Convierte tus edubids en recompensas exclusivas"
                  }
                </p>
              </div>
            </div>
          </div>
          
          {isStudent && (
            <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm min-w-[280px]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CurrencyEuroIcon className="h-6 w-6 text-green-100" />
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium">Saldo disponible</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {walletLoading ? "Cargando..." : `${walletData?.saldo || 0} EC`}
                  </p>
                  {walletData && (
                    <p className="text-xs text-green-200 mt-1 tabular-nums">
                      {walletData.bloqueado || 0} EC bloqueadas en pujas
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isTeacher && (
            <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm min-w-[280px]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-green-100" />
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium">Modo Docente</p>
                  <p className="text-lg font-bold">Gestionar Subastas</p>
                  <p className="text-xs text-green-200 mt-1">
                    Crea y administra subastas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <TrophyIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.active}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subastas activas</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.totalStudents}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estudiantes participando</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <CurrencyEuroIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.totalCoins}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">edubids en juego</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.totalBids}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de pujas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-green-50 dark:bg-green-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isTeacher ? "Tus Subastas" : "Subastas Disponibles"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isTeacher 
                  ? "Gestiona todas las subastas de tus grupos" 
                  : "Puja por recompensas academicas exclusivas"
                }
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <ArrowPathIcon className="h-4 w-4" />
              <span>Actualizado en tiempo real</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <ErrorBoundary onReset={handleReset}>
            <AuctionList key={refreshKey} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Info Sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-green-700 dark:text-green-300 text-lg mb-4 flex items-center gap-2">
              <TrophyIcon className="h-5 w-5" />
              Como funcionan las subastas?
            </h3>
            <div className="space-y-3 text-green-600 dark:text-green-400">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  1
                </div>
                <p>Los profesores crean subastas con recompensas academicas exclusivas</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  2
                </div>
                <p>Los estudiantes pujan usando sus edubids ganados en actividades</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  3
                </div>
                <p>Al terminar el tiempo, el mejor postor gana la recompensa prometida</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-green-700 dark:text-green-300 text-lg mb-4">
              Tipos de recompensas comunes
            </h3>
            <div className="space-y-2 text-green-600 dark:text-green-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Puntos extra en examenes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Exoneracion de actividades</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Beneficios especiales en clase</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Material exclusivo del docente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Reconocimientos academicos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-green-700 dark:text-green-300 text-lg mb-4">
              {isTeacher ? "Consejos para docentes" : "Consejos para pujar"}
            </h3>
            <div className="space-y-3 text-green-600 dark:text-green-400">
              {isTeacher ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-2 flex-shrink-0">
                      <UserGroupIcon className="h-4 w-4" />
                    </div>
                    <p>Selecciona recompensas que motiven a tus estudiantes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-2 flex-shrink-0">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                    <p>Establece tiempos razonables (1-7 dias recomendado)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-2 flex-shrink-0">
                      <TrophyIcon className="h-4 w-4" />
                    </div>
                    <p>Comunica claramente las reglas y recompensas</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-2 flex-shrink-0">
                      <CurrencyEuroIcon className="h-4 w-4" />
                    </div>
                    <p>Administra tus edubids sabiamente - no gastes todo en una subasta</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-2 flex-shrink-0">
                      <AcademicCapIcon className="h-4 w-4" />
                    </div>
                    <p>Prioriza recompensas que realmente te beneficien academicamente</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-2 flex-shrink-0">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                    <p>Mantente atento al tiempo restante de cada subasta</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {isStudent && (
            <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Como ganar mas edubids?</h3>
              <div className="space-y-2 text-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Completa todas tus actividades a tiempo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Obtén buenas calificaciones en tus tareas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Participa activamente en clase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Entrega trabajos de calidad</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-500">
                <p className="text-sm text-green-200">
                  <strong>Tip:</strong> Las edubids se reinician cada periodo academico
                </p>
              </div>
            </div>
          )}

          {isTeacher && (
            <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Sistema de subastas</h3>
              <div className="space-y-2 text-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Las edubids se bloquean durante la subasta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Solo el ganador paga las edubids pujadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                  <span>Puedes cerrar subastas manualmente en cualquier momento</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-500">
                <p className="text-sm text-green-200">
                  <strong>Nota:</strong> Las subastas expiradas automaticamente se marcan como cerradas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          <strong>Recordatorio:</strong> Las subastas son una herramienta educativa disenada para motivar 
          el aprendizaje y fomentar la participacion activa en clase.
        </p>
      </div>
    </div>
  );
}
