import { useState } from "react"
import { useWallet, useAllWallets, usePeriods, useTransactions, useTotalBalance } from "../../hooks/useWallet"
import { useAuthContext } from "../../context/AuthContext"
import {
  CurrencyEuroIcon,
  WalletIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  GiftIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import {
  formatDate,
  formatRelativeTime,
  formatEC,
  formatCompactEC,
  formatTransactionDescription,
  calculateAvailableBalance,
  calculateTransactionStats,
  formatAcademicPeriod
} from "../../utils/helpers"

export default function WalletPage() {
  const { user } = useAuthContext()
  const { data: mainWallet, isLoading: mainLoading, error: mainError } = useWallet()
  const { data: allWallets, isLoading: walletsLoading, error: walletsError } = useAllWallets()
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions()
  const { data: totalBalance } = useTotalBalance()
  
  const [showBalance, setShowBalance] = useState(true)
  const isTeacher = user?.role === "docente"
  const { data: periods } = usePeriods(isTeacher)

  if (mainLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Calcular estadísticas mejoradas para backend Django
  const calculateRealStats = (transactions) => {
    if (!transactions || !Array.isArray(transactions)) {
      return {
        totalGanado: 0,
        totalGastado: 0,
        netBalance: 0,
        earnCount: 0,
        spendCount: 0
      }
    }

    // Backend Django solo tiene: earn, spend, reset
    const totalGanado = transactions
      .filter(t => t.tipo === 'earn')
      .reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)

    const totalGastado = transactions
      .filter(t => t.tipo === 'spend')
      .reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)

    return {
      totalGanado,
      totalGastado,
      netBalance: totalGanado - totalGastado,
      earnCount: transactions.filter(t => t.tipo === 'earn').length,
      spendCount: transactions.filter(t => t.tipo === 'spend').length
    }
  }

  const { totalGanado, totalGastado, netBalance, earnCount, spendCount } = calculateRealStats(transactions)
  const saldoDisponible = calculateAvailableBalance(mainWallet?.saldo, mainWallet?.bloqueado)

  // Función para obtener icono de transacción para backend Django
  const getTransactionIcon = (transaction) => {
    if (transaction.tipo === "earn") {
      return <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
    } else if (transaction.tipo === "spend") {
      return <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
    } else {
      return <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
    }
  }

  // Si es docente, mostrar mensaje especial
  if (user?.role === "docente") {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Billetera</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Panel de gestión de Educoins
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Panel Docente
          </h2>
          <p className="text-blue-700 mb-4">
            Los docentes no acumulan Educoins. Puedes gestionar las billeteras de tus estudiantes desde el panel de grupos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <UserGroupIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Gestión de Grupos</h3>
              <p className="text-sm text-blue-600 mt-1">Administra periodos y wallets</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <WalletIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Depositar Educoins</h3>
              <p className="text-sm text-blue-600 mt-1">Asigna recompensas a estudiantes</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <ArrowPathIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Reiniciar Periodos</h3>
              <p className="text-sm text-blue-600 mt-1">Gestiona cortes académicos</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Billetera</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Gestiona tus Educoins y revisa tus transacciones
          </p>
        </div>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg border border-orange-200"
        >
          {showBalance ? (
            <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
          <span>{showBalance ? "Ocultar" : "Mostrar"} saldo</span>
        </button>
      </div>

      {/* Mostrar errores si existen */}
      {mainError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            Error al cargar la wallet: {mainError.message}
          </p>
        </div>
      )}

      {transactionsError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Error al cargar transacciones: {transactionsError.message}
          </p>
        </div>
      )}

      {/* Balance Principal */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0 backdrop-blur-sm">
              <WalletIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-orange-100 text-sm sm:text-base">Balance Total</p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold truncate">
                {showBalance ? formatEC(totalBalance || 0) : "••••••"}
              </h2>
              <p className="text-orange-200 text-sm mt-1">
                Suma de todas tus billeteras
              </p>
            </div>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 relative z-10">
          <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
              <ArrowTrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Total Ganado</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {showBalance ? formatEC(totalGanado) : "••••"}
            </p>
          </div>

          <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
              <ArrowTrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Total Gastado</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {showBalance ? formatEC(totalGastado) : "••••"}
            </p>
          </div>
        </div>

        {/* Solo Bloqueado - Eliminado "Disponible" */}
        {showBalance && mainWallet?.bloqueado > 0 && (
          <div className="flex justify-center mt-4 pt-4 border-t border-orange-400/30 relative z-10">
            <div className="text-center bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm min-w-[120px]">
              <p className="text-xs text-orange-200 mb-1">Bloqueado</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {formatCompactEC(mainWallet?.bloqueado || 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid de información principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Billeteras por Grupo */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              Billeteras por Grupo
            </h2>
            <div className="text-xs sm:text-sm text-gray-500 bg-orange-50 text-orange-700 px-2 sm:px-3 py-1 rounded-full font-medium">
              {allWallets?.length || 0} {allWallets?.length === 1 ? 'grupo' : 'grupos'}
            </div>
          </div>

          {walletsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : allWallets && allWallets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {allWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="border border-orange-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 bg-orange-50 hover:bg-orange-100 group"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-orange-900 text-sm sm:text-base truncate">
                          {wallet.grupo_nombre || "Grupo Principal"}
                        </h3>
                        <p className="text-xs text-orange-700 truncate">
                          {wallet.periodo_nombre || "Periodo actual"}
                        </p>
                      </div>
                    </div>
                    {wallet.periodo?.activo && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        Activo
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-orange-700">Saldo:</span>
                      <span className="text-lg sm:text-xl font-bold text-orange-900">
                        {showBalance ? formatEC(wallet.saldo || 0) : "••••"}
                      </span>
                    </div>

                    {wallet.bloqueado > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-orange-600">Bloqueado:</span>
                        <span className="font-medium text-red-600">
                          {showBalance ? formatEC(wallet.bloqueado) : "••••"}
                        </span>
                      </div>
                    )}

                    {wallet.creado && (
                      <div className="flex items-center text-xs text-orange-600 pt-2 border-t border-orange-200 mt-2">
                        <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          Creada {formatRelativeTime(wallet.creado)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-orange-50 rounded-lg border border-orange-200">
              <WalletIcon className="h-12 w-12 sm:h-16 sm:w-16 text-orange-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-orange-900 mb-2">
                No tienes billeteras creadas
              </h3>
              <p className="text-orange-700 text-sm sm:text-base max-w-md mx-auto px-4">
                Las billeteras se crean automáticamente al unirte a un grupo con periodo activo
              </p>
            </div>
          )}
        </div>

        {/* Estadísticas Rápidas */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            Resumen General
          </h2>

          <div className="space-y-4 sm:space-y-5">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Ingresos</span>
                <ArrowTrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {showBalance ? formatEC(totalGanado) : "••••"}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {earnCount} {earnCount === 1 ? 'transacción' : 'transacciones'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900">Gastos</span>
                <ArrowTrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">
                {showBalance ? formatEC(totalGastado) : "••••"}
              </p>
              <p className="text-xs text-red-700 mt-1">
                {spendCount} {spendCount === 1 ? 'transacción' : 'transacciones'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Saldo Neto</span>
                <CurrencyEuroIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                {showBalance ? formatEC(netBalance) : "••••"}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Balance general
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Transacciones */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            Historial de Transacciones
          </h2>
          {transactions && transactions.length > 0 && (
            <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full font-medium">
              {transactions.length} {transactions.length === 1 ? 'transacción' : 'transacciones'}
            </div>
          )}
        </div>

        {transactionsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {transactions.slice(0, 8).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all duration-200 group border border-gray-200"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      transaction.tipo === "earn" 
                        ? "bg-green-100 group-hover:bg-green-200"
                        : transaction.tipo === "spend"
                        ? "bg-red-100 group-hover:bg-red-200"
                        : "bg-blue-100 group-hover:bg-blue-200"
                    } transition-colors`}
                  >
                    {getTransactionIcon(transaction)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {formatTransactionDescription(transaction)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <ClockIcon className="h-3 w-3 flex-shrink-0" />
                      {formatRelativeTime(transaction.fecha)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-base sm:text-lg font-bold ml-2 sm:ml-4 flex-shrink-0 ${
                    transaction.tipo === "earn"
                      ? "text-green-600"
                      : transaction.tipo === "spend"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {transaction.tipo === "earn" ? "+" : transaction.tipo === "spend" ? "-" : "±"}
                  {showBalance ? formatEC(transaction.monto || 0) : "••••"}
                </span>
              </div>
            ))}
            
            {transactions.length > 8 && (
              <div className="text-center pt-4">
                <button className="text-orange-600 hover:text-orange-700 font-medium text-sm sm:text-base bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg border border-orange-200 transition-colors">
                  Ver todas las transacciones ({transactions.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200">
            <CurrencyEuroIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No hay transacciones
            </h3>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto px-4">
              Todavía no has realizado ninguna transacción
            </p>
          </div>
        )}
      </div>

      {/* Información adicional para móviles - Solo Bloqueado */}
      <div className="lg:hidden bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-orange-800 mb-2">
          <WalletIcon className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Resumen de tu billetera</span>
        </div>
        <div className="flex justify-center">
          <div className="text-center">
            <span className="text-orange-600 text-sm">Bloqueado: </span>
            <span className="font-medium text-orange-800 text-sm">
              {showBalance ? formatCompactEC(mainWallet?.bloqueado || 0) : "••••"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}