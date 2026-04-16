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
        <div className="bg-white rounded-2xl border border-orange-200 shadow-lg p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ocurrió un error
          </h2>
          <p className="text-gray-600 mb-6">
            No se pudieron cargar las subastas. Intenta recargar la lista.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Reintentar
            </button>
            
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Recargar página
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

  // Calcular estadísticas reales
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <BanknotesIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Subastas Académicas
                  </h1>
                  <p className="text-gray-600 mt-1 text-lg">
                    {isTeacher 
                      ? "Crea subastas motivadoras para tus estudiantes" 
                      : "Convierte tus Educoins en recompensas exclusivas"
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {isStudent && (
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg min-w-[280px]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CurrencyEuroIcon className="h-6 w-6 text-orange-100" />
                  </div>
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Saldo disponible</p>
                    <p className="text-2xl font-bold">
                      {walletLoading ? "Cargando..." : `${walletData?.saldo || 0} EC`}
                    </p>
                    {walletData && (
                      <p className="text-xs text-orange-200 mt-1">
                        {walletData.bloqueado || 0} EC bloqueadas en pujas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isTeacher && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg min-w-[280px]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-blue-100" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Modo Docente</p>
                    <p className="text-lg font-bold">Gestionar Subastas</p>
                    <p className="text-xs text-blue-200 mt-1">
                      Crea y administra subastas
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats para docentes */}
        {isTeacher && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrophyIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-sm text-gray-600">Subastas activas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AcademicCapIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-600">Estudiantes participando</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CurrencyEuroIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCoins}</p>
                  <p className="text-sm text-gray-600">Educoins en juego</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBids}</p>
                  <p className="text-sm text-gray-600">Total de pujas</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isTeacher ? "Tus Subastas" : "Subastas Disponibles"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isTeacher 
                    ? "Gestiona todas las subastas de tus grupos" 
                    : "Puja por recompensas académicas exclusivas"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
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

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-900 text-lg mb-4 flex items-center gap-2">
                <TrophyIcon className="h-5 w-5" />
                ¿Cómo funcionan las subastas?
              </h3>
              <div className="space-y-3 text-blue-700">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <p>Los profesores crean subastas con recompensas académicas exclusivas</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <p>Los estudiantes pujan usando sus Educoins ganados en actividades</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                    3
                  </div>
                  <p>Al terminar el tiempo, el mejor postor gana la recompensa prometida</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <h3 className="font-semibold text-orange-900 text-lg mb-4">
                Tipos de recompensas comunes
              </h3>
              <div className="space-y-2 text-orange-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Puntos extra en exámenes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Exoneración de actividades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Beneficios especiales en clase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Material exclusivo del docente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Reconocimientos académicos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="font-semibold text-green-900 text-lg mb-4">
                {isTeacher ? "Consejos para docentes" : "Consejos para pujar"}
              </h3>
              <div className="space-y-3 text-green-700">
                {isTeacher ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-200 text-green-800 rounded-lg p-2 flex-shrink-0">
                        <UserGroupIcon className="h-4 w-4" />
                      </div>
                      <p>Selecciona recompensas que motiven a tus estudiantes</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-200 text-green-800 rounded-lg p-2 flex-shrink-0">
                        <ClockIcon className="h-4 w-4" />
                      </div>
                      <p>Establece tiempos razonables (1-7 días recomendado)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-200 text-green-800 rounded-lg p-2 flex-shrink-0">
                        <TrophyIcon className="h-4 w-4" />
                      </div>
                      <p>Comunica claramente las reglas y recompensas</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-200 text-green-800 rounded-lg p-2 flex-shrink-0">
                        <CurrencyEuroIcon className="h-4 w-4" />
                      </div>
                      <p>Administra tus Educoins sabiamente - no gastes todo en una subasta</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-200 text-green-800 rounded-lg p-2 flex-shrink-0">
                        <AcademicCapIcon className="h-4 w-4" />
                      </div>
                      <p>Prioriza recompensas que realmente te beneficien académicamente</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-200 text-green-800 rounded-lg p-2 flex-shrink-0">
                        <ClockIcon className="h-4 w-4" />
                      </div>
                      <p>Mantente atento al tiempo restante de cada subasta</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isStudent && (
              <div className="bg-indigo-500 rounded-2xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-3">¿Cómo ganar más Educoins?</h3>
                <div className="space-y-2 text-purple-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-300 rounded-full"></div>
                    <span>Completa todas tus actividades a tiempo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-300 rounded-full"></div>
                    <span>Obtén buenas calificaciones en tus tareas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-300 rounded-full"></div>
                    <span>Participa activamente en clase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-300 rounded-full"></div>
                    <span>Entrega trabajos de calidad</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-500">
                  <p className="text-sm text-purple-200">
                    <strong>Tip:</strong> Las Educoins se reinician cada periodo académico
                  </p>
                </div>
              </div>
            )}

            {isTeacher && (
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-3">Sistema de subastas</h3>
                <div className="space-y-2 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                    <span>Las Educoins se bloquean durante la subasta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                    <span>Solo el ganador paga las Educoins pujadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                    <span>Puedes cerrar subastas manualmente en cualquier momento</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-500">
                  <p className="text-sm text-indigo-200">
                    <strong>Nota:</strong> Las subastas expiradas automáticamente se marcan como cerradas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            <strong>Recordatorio:</strong> Las subastas son una herramienta educativa diseñada para motivar 
            el aprendizaje y fomentar la participación activa en clase.
          </p>
        </div>
      </div>
    </main>
  );
}