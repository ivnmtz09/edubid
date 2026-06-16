import { useState } from "react"
import { useWallet, useAllWallets, useTransactions, useTotalBalance } from "../../hooks/useWallet"
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
  formatRelativeTime,
  formatEC,
  formatCompactEC,
  formatTransactionDescription,
} from "../../utils/helpers"

export default function WalletPage() {
  const { user } = useAuthContext()
  const { data: mainWallet, isLoading: mainLoading, error: mainError } = useWallet()
  const { data: allWallets, isLoading: walletsLoading } = useAllWallets()
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions()
  const { data: totalBalance } = useTotalBalance()
  
  const [showBalance, setShowBalance] = useState(true)
  const isTeacher = user?.role === "docente"
  if (mainLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

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

  const getTransactionIcon = (transaction) => {
    if (transaction.tipo === "earn") {
      return <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
    } else if (transaction.tipo === "spend") {
      return <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
    } else {
      return <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
    }
  }

  if (user?.role === "docente") {
    return (
      <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Mi Billetera</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Panel de gestion de educoins
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300 mb-2 text-center">
            Panel Docente
          </h2>
          <p className="text-yellow-600 dark:text-yellow-400 mb-6 text-center">
            Los docentes no acumulan educoins. Puedes gestionar las billeteras de tus estudiantes desde el panel de grupos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900/20 text-center">
              <UserGroupIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Gestion de Grupos</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Administra periodos y wallets</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900/20 text-center">
              <WalletIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Depositar educoins</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Asigna recompensas a estudiantes</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900/20 text-center">
              <ArrowPathIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Reiniciar Periodos</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Gestiona cortes academicos</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Mi Billetera</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Gestiona tus educoins y revisa tus transacciones
          </p>
        </div>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-all text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 px-4 py-2 rounded-lg border border-yellow-200 dark:border-yellow-900/20 active:scale-[0.96]"
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
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-300 text-sm">
            Error al cargar la wallet: {mainError.message}
          </p>
        </div>
      )}

      {transactionsError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm">
            Error al cargar transacciones: {transactionsError.message}
          </p>
        </div>
      )}

      {/* Balance Principal */}
      <div className="bg-yellow-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-sm relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
              <WalletIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-yellow-100 text-sm sm:text-base">Balance Total</p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold truncate tabular-nums">
                {showBalance ? formatEC(totalBalance || 0) : "******"}
              </h2>
              <p className="text-yellow-200 text-sm mt-1">
                Suma de todas tus billeteras
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 relative z-10">
          <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
              <ArrowTrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Total Ganado</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums">
              {showBalance ? formatEC(totalGanado) : "****"}
            </p>
          </div>

          <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
              <ArrowTrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Total Gastado</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums">
              {showBalance ? formatEC(totalGastado) : "****"}
            </p>
          </div>
        </div>

        {showBalance && (mainWallet?.bloqueado_educoins ?? mainWallet?.bloqueado) > 0 && (
          <div className="flex justify-center mt-4 pt-4 border-t border-yellow-500/30 relative z-10">
            <div className="text-center bg-white/10 rounded-lg p-3 sm:p-4 min-w-[120px]">
              <p className="text-xs text-yellow-200 mb-1">Bloqueado</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white tabular-nums">
                {formatCompactEC(mainWallet?.bloqueado_educoins ?? mainWallet?.bloqueado ?? 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid de informacion principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Billeteras por Grupo */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              Billeteras por Grupo
            </h2>
            <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/10 px-2 sm:px-3 py-1 rounded-full font-medium tabular-nums">
              {allWallets?.length || 0} {allWallets?.length === 1 ? 'grupo' : 'grupos'}
            </div>
          </div>

          {walletsLoading ? (
            <div className="flex justify-center py-8 flex-1 items-center">
              <LoadingSpinner size="md" />
            </div>
          ) : allWallets && allWallets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {allWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="border border-yellow-200 dark:border-yellow-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 group"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex-shrink-0 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/30 transition-colors">
                        <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm sm:text-base truncate">
                          {wallet.grupo_nombre || "Grupo Principal"}
                        </h3>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 truncate">
                          {wallet.periodo_nombre || "Periodo actual"}
                        </p>
                      </div>
                    </div>
                    {wallet.periodo?.activo && (
                      <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">
                        Activo
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">Saldo:</span>
                      <span className="text-lg sm:text-xl font-bold text-yellow-800 dark:text-yellow-300 tabular-nums">
                        {showBalance ? formatEC(wallet.saldo_educoins || 0) : "****"}
                      </span>
                    </div>

                    {wallet.bloqueado_educoins > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-yellow-600 dark:text-yellow-400">Bloqueado:</span>
                        <span className="font-medium text-red-500 tabular-nums">
                          {showBalance ? formatEC(wallet.bloqueado_educoins) : "****"}
                        </span>
                      </div>
                    )}

                    {wallet.creado && (
                      <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 pt-2 border-t border-yellow-200 dark:border-yellow-900/20 mt-2">
                        <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate tabular-nums">
                          Creada {formatRelativeTime(wallet.creado)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-dashed border-yellow-300 dark:border-yellow-700 flex-1 flex flex-col items-center justify-center">
              <WalletIcon className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-300 dark:text-yellow-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                No tienes billeteras creadas
              </h3>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm sm:text-base max-w-md mx-auto px-4">
                Las billeteras se crean automaticamente al unirte a un grupo con periodo activo
              </p>
            </div>
          )}
        </div>

        {/* Estadisticas Rapidas */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            Resumen General
          </h2>

          <div className="space-y-4 sm:space-y-5 flex-1">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200 dark:border-yellow-900/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Ingresos</span>
                <ArrowTrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-700 dark:text-yellow-300 tabular-nums">
                {showBalance ? formatEC(totalGanado) : "****"}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 tabular-nums">
                {earnCount} {earnCount === 1 ? 'transaccion' : 'transacciones'}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200 dark:border-red-900/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-800 dark:text-red-300">Gastos</span>
                <ArrowTrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                {showBalance ? formatEC(totalGastado) : "****"}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 tabular-nums">
                {spendCount} {spendCount === 1 ? 'transaccion' : 'transacciones'}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200 dark:border-yellow-900/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Saldo Neto</span>
                <CurrencyEuroIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-700 dark:text-yellow-300 tabular-nums">
                {showBalance ? formatEC(netBalance) : "****"}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Balance general
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Transacciones */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 mb-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            Historial de Transacciones
          </h2>
          {transactions && transactions.length > 0 && (
            <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/10 px-2 sm:px-3 py-1 rounded-full font-medium tabular-nums">
              {transactions.length} {transactions.length === 1 ? 'transaccion' : 'transacciones'}
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
                className="flex items-center justify-between p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg sm:rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-all duration-200 group border border-yellow-200 dark:border-yellow-900/20"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                      transaction.tipo === "earn" 
                        ? "bg-yellow-100 dark:bg-yellow-900/20 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/30"
                        : transaction.tipo === "spend"
                        ? "bg-red-100 dark:bg-red-900/20 group-hover:bg-red-200 dark:group-hover:bg-red-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/20 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/30"
                    }`}
                  >
                    {getTransactionIcon(transaction)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                      {formatTransactionDescription(transaction)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 tabular-nums">
                      <ClockIcon className="h-3 w-3 flex-shrink-0" />
                      {formatRelativeTime(transaction.fecha)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-base sm:text-lg font-bold ml-2 sm:ml-4 flex-shrink-0 tabular-nums ${
                    transaction.tipo === "earn"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : transaction.tipo === "spend"
                      ? "text-red-500"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {transaction.tipo === "earn" ? "+" : transaction.tipo === "spend" ? "-" : "+/-"}
                  {showBalance ? formatEC(transaction.monto || 0) : "****"}
                </span>
              </div>
            ))}
            
            {transactions.length > 8 && (
              <div className="text-center pt-4">
                <button className="text-yellow-700 dark:text-yellow-300 font-medium text-sm sm:text-base bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 px-4 py-2 rounded-lg border border-yellow-200 dark:border-yellow-900/20 transition-all active:scale-[0.96]">
                  Ver todas las transacciones ({transactions.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-dashed border-yellow-300 dark:border-yellow-700">
            <CurrencyEuroIcon className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-300 dark:text-yellow-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-2">
              No hay transacciones
            </h3>
            <p className="text-yellow-600 dark:text-yellow-400 text-sm sm:text-base max-w-md mx-auto px-4">
              Todavia no has realizado ninguna transaccion
            </p>
          </div>
        )}
      </div>

      {/* Informacion adicional para moviles */}
      <div className="lg:hidden bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 mb-2">
          <WalletIcon className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Resumen de tu billetera</span>
        </div>
        <div className="flex justify-center">
          <div className="text-center">
            <span className="text-yellow-600 dark:text-yellow-400 text-sm">Bloqueado: </span>
            <span className="font-medium text-yellow-800 dark:text-yellow-300 text-sm tabular-nums">
              {showBalance ? formatCompactEC(mainWallet?.bloqueado_educoins ?? mainWallet?.bloqueado ?? 0) : "****"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
