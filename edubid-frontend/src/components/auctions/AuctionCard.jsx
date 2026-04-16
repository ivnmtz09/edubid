import { Link } from "react-router-dom"
import { 
  ShoppingBagIcon, 
  CalendarIcon, 
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon,
  CurrencyEuroIcon
} from "@heroicons/react/24/outline"
import { useAuthContext } from "../../context/AuthContext"
import { getAuctionStatus, formatAuctionTimeRemaining, AUCTION_COLORS } from "../../utils/auctionHelpers"
import { formatDateTime, formatEC } from "../../utils/helpers"

const AuctionCard = ({ auction, onEdit, onDelete, onClose }) => {
  const { user } = useAuthContext()
  const isTeacher = user?.role === "docente"

  const status = getAuctionStatus(auction)
  const fechaFin = new Date(auction.fecha_fin)
  const now = new Date()
  const hasEnded = fechaFin < now
  const isExpired = auction.estado === "active" && hasEnded

  const winnerInfo = auction.puja_ganadora
  const highestBid = auction.bids?.[0]

  return (
    <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
      status.status === 'active' ? 'border-green-200' : 'border-gray-200'
    }`}>
      {/* Header - Verde para detalles principales */}
      <div className={`p-4 sm:p-5 text-white ${
        status.status === 'active' 
          ? 'bg-gradient-to-r from-green-500 to-green-600' 
          : 'bg-gradient-to-r from-gray-500 to-gray-600'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
              <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base sm:text-lg line-clamp-2">{auction.titulo}</h3>
              <p className="text-green-100 text-xs sm:text-sm mt-1 truncate">
                {auction.grupo_nombre || auction.grupo?.nombre}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className={`px-2 sm:px-3 py-1 rounded-full font-medium ${
            status.status === 'active' ? 'bg-green-500/20' : 'bg-gray-500/20'
          }`}>
            {status.label}
          </span>
          {status.status === 'active' && !hasEnded && (
            <div className="text-right">
              <p className="opacity-75 text-xs">Tiempo restante</p>
              <p className={`font-bold ${status.status === 'expired' ? 'text-red-300' : 'text-green-100'} text-sm`}>
                {formatAuctionTimeRemaining(auction.fecha_fin)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        {/* Descripción */}
        <p className="text-gray-600 text-sm line-clamp-3 min-h-[48px] sm:min-h-[60px]">
          {auction.descripcion || "Sin descripción disponible"}
        </p>

        {/* Info Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Estado:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              status.status === 'active' ? "bg-green-100 text-green-700" : 
              status.status === 'closed' ? "bg-gray-100 text-gray-700" : 
              "bg-red-100 text-red-700"
            }`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-1 text-gray-500">
              <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{status.status === 'closed' ? "Finalizó:" : "Finaliza:"}</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-gray-900 text-xs sm:text-sm">
                {formatDateTime(auction.fecha_fin)}
              </span>
              {status.status === 'active' && !hasEnded && (
                <div className={`text-xs ${status.status === 'expired' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {formatAuctionTimeRemaining(auction.fecha_fin)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-1 text-gray-500">
              <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Pujas:</span>
            </div>
            <span className="font-bold text-orange-600">{auction.total_pujas || 0}</span>
          </div>

          {highestBid && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-1 text-gray-500">
                <TrophyIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Puja más alta:</span>
              </div>
              <span className="font-bold text-green-600">{formatEC(highestBid.cantidad)}</span>
            </div>
          )}

          {isTeacher && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Creada por:</span>
              <span className="text-gray-900 font-medium truncate ml-2">
                {auction.creador_nombre || auction.creador?.first_name || 'Tú'}
              </span>
            </div>
          )}

          {/* Ganador si está cerrada - Verde para detalles del ganador */}
          {status.status === 'closed' && winnerInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mt-2">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                <span className="text-green-700 font-medium">Ganador:</span>
                <span className="text-green-900 font-semibold truncate ml-2">
                  {winnerInfo.estudiante_nombre}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-green-600">Puja ganadora:</span>
                <span className="text-green-800 font-bold">
                  {formatEC(winnerInfo.cantidad)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex flex-col sm:flex-row gap-2">
        <Link
          to={`/auctions/${auction.id}`}
          className="flex-1 bg-green-50 text-green-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-100 transition text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2"
        >
          <span>{isTeacher ? "Gestionar" : "Ver Detalles"}</span>
        </Link>
        
        {isTeacher && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(auction)}
              disabled={status.status === 'closed'}
              className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              title={status.status === 'closed' ? "No se puede editar subastas cerradas" : "Editar subasta"}
            >
              <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            
            {status.status === 'active' && (
              <button
                onClick={() => onClose(auction.id)}
                className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-medium flex items-center justify-center gap-1"
                title="Cerrar subasta manualmente"
              >
                <span className="hidden sm:inline">Cerrar</span>
              </button>
            )}
            
            <button
              onClick={() => onDelete(auction.id)}
              disabled={status.status === 'closed'}
              className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              title={status.status === 'closed' ? "No se puede eliminar subastas cerradas" : "Eliminar subasta"}
            >
              <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuctionCard