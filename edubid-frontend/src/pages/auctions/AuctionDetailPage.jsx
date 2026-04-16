import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  TrophyIcon,
  CurrencyEuroIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthContext } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useWallet';
import api from '../../services/api';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: walletData } = useWallet();
  const queryClient = useQueryClient();

  const [bidAmount, setBidAmount] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);

  const isTeacher = user?.role === 'docente';
  const isStudent = user?.role === 'estudiante';

  // Fetch auction
  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const res = await api.get(`/api/auctions/auctions/${id}/`);
      return res.data;
    },
  });

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/api/auctions/bids/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction', id]);
      queryClient.invalidateQueries(['wallet']);
      setBidAmount('');
      setShowBidForm(false);
    },
  });

  // Close auction mutation
  const closeAuctionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/auctions/auctions/${id}/close/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction', id]);
      queryClient.invalidateQueries(['auctions']);
    },
  });

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Subasta no encontrada</p>
        <button
          onClick={() => navigate('/auctions')}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Volver a Subastas
        </button>
      </div>
    );
  }

  const isActive = auction.estado === 'active';
  const isClosed = auction.estado === 'closed';
  const fechaFin = new Date(auction.fecha_fin);
  const now = new Date();
  const timeRemaining = fechaFin - now;
  const hasEnded = timeRemaining <= 0;

  const userBid = auction.bids?.find(b => b.estudiante?.id === user?.id);
  const highestBid = auction.bids?.[0];
  const isWinning = userBid?.id === highestBid?.id;

  const saldoDisponible = walletData ? walletData.saldo - walletData.bloqueado : 0;
  const minBid = highestBid ? highestBid.cantidad + 1 : 1;

  const handlePlaceBid = () => {
    const amount = parseInt(bidAmount);
    
    if (!amount || amount < minBid) {
      alert(`La puja mínima es ${minBid} EC`);
      return;
    }

    if (amount > saldoDisponible) {
      alert('No tienes suficiente saldo disponible');
      return;
    }

    placeBidMutation.mutate({
      auction: auction.id,
      estudiante: user.id,
      cantidad: amount,
    });
  };

  const getTimeRemainingText = () => {
    if (hasEnded) return 'Finalizada';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/auctions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition self-start"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="text-sm sm:text-base">Volver</span>
        </button>

        {isTeacher && isActive && (
          <button
            onClick={() => closeAuctionMutation.mutate()}
            disabled={closeAuctionMutation.isPending}
            className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
          >
            {closeAuctionMutation.isPending ? 'Cerrando...' : 'Cerrar Subasta'}
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header - Verde para detalles */}
        <div className={`p-4 sm:p-6 lg:p-8 text-white ${
          isActive ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">{auction.titulo}</h1>
                <p className="text-green-100 mt-1 text-sm sm:text-base">Grupo: {auction.grupo_nombre}</p>
              </div>
            </div>
            
            <div className="flex flex-row justify-between items-center sm:flex-col sm:items-end gap-2 sm:gap-3">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                isActive ? 'bg-green-500/20 text-white' : 'bg-gray-500/20 text-white'
              } whitespace-nowrap`}>
                {isActive ? 'Activa' : 'Cerrada'}
              </span>
              {isActive && (
                <div className="text-right sm:text-right">
                  <p className="text-xs sm:text-sm text-green-100">Tiempo restante</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold whitespace-nowrap">{getTimeRemainingText()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Description */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Descripción</h2>
            <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">{auction.descripcion}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-600">Participantes</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{auction.total_pujas || 0}</p>
            </div>

            <div className="bg-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <CurrencyEuroIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <span className="text-xs sm:text-sm text-gray-600">Puja más alta</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {highestBid?.cantidad || 0} EC
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 xs:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-600">Finaliza</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-blue-600 break-words">
                {formatDateTime(auction.fecha_fin)}
              </p>
            </div>
          </div>

          {/* Student Bid Section */}
          {isStudent && (
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              {isClosed && auction.puja_ganadora ? (
                <div className={`rounded-lg sm:rounded-xl p-4 sm:p-6 ${
                  auction.puja_ganadora.estudiante_id === user.id
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  {auction.puja_ganadora.estudiante_id === user.id ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        <h3 className="text-base sm:text-lg font-bold text-green-900">¡Felicidades! Ganaste la subasta</h3>
                      </div>
                      <p className="text-green-700 text-sm sm:text-base">
                        Puja ganadora: <span className="font-bold">{auction.puja_ganadora.cantidad} EC</span>
                      </p>
                      <p className="text-xs sm:text-sm text-green-600 mt-2">
                        Contacta a tu profesor para reclamar tu recompensa
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Subasta Finalizada</h3>
                      <p className="text-gray-600 text-sm sm:text-base">
                        Ganador: <span className="font-medium">{auction.puja_ganadora.estudiante_nombre}</span>
                      </p>
                      <p className="text-gray-600 text-sm sm:text-base">
                        Puja ganadora: <span className="font-medium">{auction.puja_ganadora.cantidad} EC</span>
                      </p>
                    </>
                  )}
                </div>
              ) : isActive && !hasEnded ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Current User Bid */}
                  {userBid && (
                    <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 ${
                      isWinning
                        ? 'bg-green-50 border-green-500'
                        : 'bg-orange-50 border-orange-500'
                    }`}>
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Tu puja actual</p>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">{userBid.cantidad} EC</p>
                        </div>
                        {isWinning ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            <span className="font-medium text-sm sm:text-base">Vas ganando</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            <span className="font-medium text-sm sm:text-base">Superado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Wallet Info - Naranja para coins/wallet */}
                  <div className="bg-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Saldo disponible</p>
                        <p className="text-lg sm:text-xl font-bold text-orange-600">{saldoDisponible} EC</p>
                      </div>
                      <div className="text-left xs:text-right">
                        <p className="text-xs sm:text-sm text-gray-600">Puja mínima</p>
                        <p className="text-base sm:text-lg font-semibold text-orange-900">{minBid} EC</p>
                      </div>
                    </div>
                  </div>

                  {/* Bid Form */}
                  {!showBidForm ? (
                    <button
                      onClick={() => setShowBidForm(true)}
                      disabled={saldoDisponible < minBid}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {userBid ? 'Aumentar Puja' : 'Realizar Puja'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad de Educoins
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={minBid}
                            max={saldoDisponible}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={`Mínimo ${minBid} EC`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                            EC
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={() => {
                            setShowBidForm(false);
                            setBidAmount('');
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handlePlaceBid}
                          disabled={placeBidMutation.isPending || !bidAmount}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 text-sm sm:text-base"
                        >
                          {placeBidMutation.isPending ? 'Pujando...' : 'Confirmar Puja'}
                        </button>
                      </div>
                    </div>
                  )}

                  {saldoDisponible < minBid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <p className="text-red-700 text-xs sm:text-sm">
                        No tienes suficiente saldo para pujar. Necesitas al menos {minBid} EC disponibles.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
                  <ClockIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">Esta subasta ha finalizado</p>
                </div>
              )}
            </div>
          )}

          {/* Bids List (Teacher View) */}
          {isTeacher && auction.bids && auction.bids.length > 0 && (
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Todas las Pujas ({auction.bids.length})
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {auction.bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 rounded-lg ${
                      index === 0
                        ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start xs:items-center gap-2 sm:gap-3 mb-2 xs:mb-0">
                      {index === 0 && (
                        <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-1 xs:mt-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                          {bid.estudiante_nombre || `${bid.estudiante?.first_name} ${bid.estudiante?.last_name}`}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 break-all">
                          {bid.estudiante_email || bid.estudiante?.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(bid.creado)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left xs:text-right">
                      <p className="text-lg sm:text-xl font-bold text-orange-600">{bid.cantidad} EC</p>
                      {index === 0 && (
                        <p className="text-xs text-green-600 font-medium">Puja más alta</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;