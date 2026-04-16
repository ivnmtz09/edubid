import { useState } from "react"
import { CurrencyDollarIcon, PlusIcon, PencilIcon, TrophyIcon } from "@heroicons/react/24/outline"
import { usePlaceBid, useIncreaseBid, useDeleteBid } from "../../hooks/useAuctions"
import { formatEC } from "../../utils/helpers"
import LoadingSpinner from "../common/LoadingSpinner"

const BidForm = ({ auction, userBalance = 0, existingBid = null }) => {
  const placeBid = usePlaceBid()
  const increaseBid = useIncreaseBid()
  const deleteBid = useDeleteBid()
  
  const [bidAmount, setBidAmount] = useState("")
  const [error, setError] = useState("")
  const [isIncreasing, setIsIncreasing] = useState(false)

  const highestBid = auction.puja_mas_alta || auction.bids?.[0]
  const minBid = highestBid ? highestBid.cantidad + 1 : 1
  const isWinning = existingBid?.id === highestBid?.id

  // Función para extraer mensajes de error del backend
  const extractErrorMessage = (error) => {
    if (!error.response) {
      return "Error de conexión. Intenta nuevamente."
    }
    
    const data = error.response.data
    
    // Django REST framework puede devolver errores en diferentes formatos
    if (typeof data === 'string') {
      return data
    }
    
    if (data.detail) {
      return data.detail
    }
    
    if (data.cantidad && Array.isArray(data.cantidad)) {
      return data.cantidad[0]
    }
    
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors[0]
    }
    
    // Si es un objeto, intentar encontrar el primer mensaje de error
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        return `${key}: ${data[key][0]}`
      }
    }
    
    return "Error desconocido al realizar la puja"
  }

  const handleCreateBid = async () => {
    const amount = parseInt(bidAmount)

    if (!amount || amount < minBid) {
      setError(`La puja mínima es ${formatEC(minBid)}`)
      return
    }

    if (amount > userBalance) {
      setError("No tienes suficiente saldo disponible")
      return
    }

    try {
      await placeBid.mutateAsync({ 
        auctionId: auction.id, 
        cantidad: amount 
      })
      setBidAmount("")
      setError("")
    } catch (error) {
      const errorMsg = extractErrorMessage(error)
      setError(errorMsg)
    }
  }

  const handleIncreaseBid = async () => {
    const newAmount = parseInt(bidAmount)

    if (!newAmount || newAmount <= existingBid.cantidad) {
      setError(`La nueva puja debe ser mayor a ${formatEC(existingBid.cantidad)}`)
      return
    }

    if (newAmount > userBalance + existingBid.cantidad) {
      setError("No tienes suficiente saldo disponible para este aumento")
      return
    }

    try {
      await increaseBid.mutateAsync({ 
        bidId: existingBid.id, 
        nuevaCantidad: newAmount 
      })
      setBidAmount("")
      setError("")
      setIsIncreasing(false)
    } catch (error) {
      const errorMsg = extractErrorMessage(error)
      setError(errorMsg)
    }
  }

  const handleDeleteBid = async () => {
    if (!window.confirm("¿Estás seguro de que quieres retirar tu puja?")) {
      return
    }

    try {
      await deleteBid.mutateAsync(existingBid.id)
    } catch (error) {
      const errorMsg = extractErrorMessage(error)
      setError(errorMsg)
    }
  }

  const handleCancel = () => {
    setBidAmount("")
    setError("")
    setIsIncreasing(false)
  }

  const isActive = auction.estado === "active"
  const hasEnded = new Date(auction.fecha_fin) < new Date()

  if (!isActive || hasEnded) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="text-center py-4">
          <p className="text-gray-500">Esta subasta ha finalizado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Realizar Puja</h3>

      <div className="space-y-4">
        {/* Información de pujas actuales */}
        <div className="space-y-2">
          {highestBid && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Puja más alta:</span>
              <span className="font-medium text-green-600">{formatEC(highestBid.cantidad)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Puja mínima:</span>
            <span className="font-medium text-orange-600">{formatEC(minBid)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tu saldo disponible:</span>
            <span className="font-medium text-orange-900">{formatEC(userBalance)}</span>
          </div>

          {existingBid && (
            <div className={`flex items-center justify-between text-sm p-3 rounded-lg ${
              isWinning ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Tu puja actual:</span>
                {isWinning && <TrophyIcon className="h-4 w-4 text-green-600" />}
              </div>
              <span className="font-bold text-orange-600">{formatEC(existingBid.cantidad)}</span>
            </div>
          )}
        </div>

        {/* Mensaje para quien tiene la puja más alta */}
        {existingBid && isWinning && !isIncreasing && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-green-800 text-sm font-medium">
              🏆 Tienes la puja más alta. No necesitas pujar más.
            </p>
          </div>
        )}

        {/* Formulario de puja */}
        {(!existingBid || (existingBid && !isWinning) || isIncreasing) ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
                {existingBid ? "Nueva cantidad" : "Tu Puja"}
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="number"
                  id="bidAmount"
                  value={bidAmount}
                  onChange={(e) => {
                    setBidAmount(e.target.value)
                    if (error) setError("")
                  }}
                  className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${
                    error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder={minBid.toString()}
                  min={minBid}
                  max={userBalance + (existingBid?.cantidad || 0)}
                  required
                />
              </div>
              {error && (
                <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {(existingBid && isIncreasing) && (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={existingBid ? handleIncreaseBid : handleCreateBid}
                disabled={placeBid.isPending || increaseBid.isPending || !bidAmount}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {(placeBid.isPending || increaseBid.isPending) ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    {existingBid ? <PencilIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                    {existingBid ? "Aumentar Puja" : "Realizar Puja"}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!isWinning && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-orange-800 text-sm">
                  Tu puja ha sido superada. Puedes aumentarla para recuperar la ventaja.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {!isWinning && (
                <button
                  onClick={() => setIsIncreasing(true)}
                  className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 hover:bg-blue-600"
                >
                  <PencilIcon className="h-3 w-3" />
                  Aumentar
                </button>
              )}
              <button
                onClick={handleDeleteBid}
                disabled={deleteBid.isPending}
                className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 hover:bg-red-600 disabled:opacity-50"
              >
                {deleteBid.isPending ? <LoadingSpinner size="sm" /> : "Retirar"}
              </button>
            </div>
          </div>
        )}

        {userBalance < minBid && !existingBid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm text-center">
              No tienes suficiente saldo para pujar. Necesitas al menos {formatEC(minBid)} disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BidForm