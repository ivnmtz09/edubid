import { useState, useEffect } from 'react';
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
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuthContext } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useWallet';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: walletData } = useWallet();
  const queryClient = useQueryClient();

  const [bidAmount, setBidAmount] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);

  const [teacherBidStudent, setTeacherBidStudent] = useState('');
  const [teacherBidAmount, setTeacherBidAmount] = useState('');
  const [teacherBidError, setTeacherBidError] = useState('');
  const [groupStudents, setGroupStudents] = useState([]);

  const isTeacher = user?.role === 'docente';
  const isStudent = user?.role === 'estudiante';

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const res = await api.get(`/api/auctions/auctions/${id}/`);
      return res.data;
    },
  });

  useEffect(() => {
    if (isTeacher && auction?.grupo) {
      const grupoId = auction.grupo?.id || auction.grupo
      api.get(`/api/groups/${grupoId}/estudiantes/`)
        .then(res => setGroupStudents(res.data))
        .catch(() => setGroupStudents([]))
    }
  }, [isTeacher, auction?.grupo, auction?.grupo?.id])

  const placeBidMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/api/auctions/bids/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['all-wallets'] });
      setBidAmount('');
      setShowBidForm(false);
      setTeacherBidAmount('');
      setTeacherBidStudent('');
      setTeacherBidError('');
    },
    onError: (error) => {
      const data = error.response?.data
      const msg = data?.detail || data?.non_field_errors?.[0] || data?.cantidad?.[0] || 'Error al realizar la puja'
      setTeacherBidError(msg)
    },
  });

  const closeAuctionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/auctions/auctions/${id}/close/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
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
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all active:scale-[0.96]"
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
  const incrementoMinimo = auction?.incremento_minimo || 10;
  const minBid = highestBid ? highestBid.cantidad + incrementoMinimo : (auction?.valor_minimo || 1);

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
    <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/auctions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all self-start active:scale-[0.96]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="text-sm sm:text-base">Volver</span>
        </button>

        {isTeacher && isActive && (
          <button
            onClick={() => closeAuctionMutation.mutate()}
            disabled={closeAuctionMutation.isPending}
            className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 text-sm sm:text-base whitespace-nowrap active:scale-[0.96]"
          >
            {closeAuctionMutation.isPending ? 'Cerrando...' : 'Cerrar Subasta'}
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className={`p-4 sm:p-6 lg:p-8 text-white ${
          isActive ? 'bg-green-600' : 'bg-gray-600'
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
                  <p className="text-base sm:text-lg lg:text-xl font-bold tabular-nums whitespace-nowrap">{getTimeRemainingText()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Description */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Descripción</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm sm:text-base">{auction.descripcion}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-900/20">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Participantes</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{auction.total_pujas || 0}</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-900/20">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <CurrencyEuroIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Puja más alta</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                {highestBid?.cantidad || 0} EC
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-900/20 xs:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Finaliza</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 break-words tabular-nums">
                {formatDateTime(auction.fecha_fin)}
              </p>
            </div>
          </div>

          {/* Student Bid Section */}
          {isStudent && (
            <div className="border-t border-gray-200 dark:border-white/10 pt-4 sm:pt-6">
              {isClosed && auction.puja_ganadora ? (
                <div className={`rounded-lg sm:rounded-xl p-4 sm:p-6 ${
                  auction.puja_ganadora.estudiante_id === user.id
                    ? 'bg-green-50 dark:bg-green-900/10 border-2 border-green-500'
                    : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10'
                }`}>
                  {auction.puja_ganadora.estudiante_id === user.id ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                        <h3 className="text-base sm:text-lg font-bold text-green-900 dark:text-green-300">Felicidades! Ganaste la subasta</h3>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-sm sm:text-base">
                        Puja ganadora: <span className="font-bold tabular-nums">{auction.puja_ganadora.cantidad} EC</span>
                      </p>
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-2">
                        Contacta a tu profesor para reclamar tu recompensa
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Subasta Finalizada</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Ganador: <span className="font-medium">{auction.puja_ganadora.estudiante_nombre}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Puja ganadora: <span className="font-medium tabular-nums">{auction.puja_ganadora.cantidad} EC</span>
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
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-500'
                    }`}>
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Tu puja actual</p>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{userBid.cantidad} EC</p>
                        </div>
                        {isWinning ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            <span className="font-medium text-sm sm:text-base">Vas ganando</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            <span className="font-medium text-sm sm:text-base">Superado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Wallet Info */}
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-900/20">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Saldo disponible</p>
                        <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 tabular-nums">{saldoDisponible} EC</p>
                      </div>
                      <div className="text-left xs:text-right">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Puja mínima</p>
                        <p className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-300 tabular-nums">{minBid} EC</p>
                      </div>
                    </div>
                  </div>

                  {/* Bid Form */}
                  {!showBidForm ? (
                    <button
                      onClick={() => setShowBidForm(true)}
                      disabled={saldoDisponible < minBid}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base active:scale-[0.96]"
                    >
                      {userBid ? 'Aumentar Puja' : 'Realizar Puja'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cantidad de edubids
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={minBid}
                            max={saldoDisponible}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 tabular-nums"
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
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-medium text-sm sm:text-base active:scale-[0.96]"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handlePlaceBid}
                          disabled={placeBidMutation.isPending || !bidAmount}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 text-sm sm:text-base active:scale-[0.96]"
                        >
                          {placeBidMutation.isPending ? 'Pujando...' : 'Confirmar Puja'}
                        </button>
                      </div>
                    </div>
                  )}

                  {saldoDisponible < minBid && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-3 sm:p-4">
                      <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm">
                        No tienes suficiente saldo para pujar. Necesitas al menos {minBid} EC disponibles.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
                  <ClockIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Esta subasta ha finalizado</p>
                </div>
              )}
            </div>
          )}

          {/* Teacher Bid Section */}
          {isTeacher && isActive && !hasEnded && (
            <div className="border-t border-gray-200 dark:border-white/10 pt-4 sm:pt-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                Pujar por un Estudiante
              </h2>
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-xl p-4 sm:p-6 space-y-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Si un estudiante no puede acceder a la plataforma, puedes registrar su puja desde aqui.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estudiante
                    </label>
                    <select
                      value={teacherBidStudent}
                      onChange={(e) => { setTeacherBidStudent(e.target.value); setTeacherBidError('') }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Seleccionar estudiante</option>
                      {groupStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cantidad (EC)
                    </label>
                    <input
                      type="number"
                      value={teacherBidAmount}
                      onChange={(e) => { setTeacherBidAmount(e.target.value); setTeacherBidError('') }}
                      min={minBid}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 tabular-nums"
                      placeholder={`Minimo ${minBid} EC`}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        if (!teacherBidStudent) { setTeacherBidError('Selecciona un estudiante'); return }
                        if (!parseInt(teacherBidAmount) || parseInt(teacherBidAmount) < minBid) {
                          setTeacherBidError(`La puja minima es ${minBid} EC`); return
                        }
                        placeBidMutation.mutate({
                          auction: auction.id,
                          estudiante: parseInt(teacherBidStudent),
                          cantidad: parseInt(teacherBidAmount),
                        })
                      }}
                      disabled={placeBidMutation.isPending}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.96]"
                    >
                      {placeBidMutation.isPending ? <LoadingSpinner size="sm" /> : <><PlusIcon className="h-4 w-4" /> Pujar</>}
                    </button>
                  </div>
                </div>
                {teacherBidError && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{teacherBidError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bids List (Teacher View) */}
          {isTeacher && auction.bids && auction.bids.length > 0 && (
            <div className="border-t border-gray-200 dark:border-white/10 pt-4 sm:pt-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                Todas las Pujas ({auction.bids.length})
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {auction.bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 rounded-lg ${
                      index === 0
                        ? 'bg-green-50 dark:bg-green-900/10 border-2 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-start xs:items-center gap-2 sm:gap-3 mb-2 xs:mb-0">
                      {index === 0 && (
                        <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1 xs:mt-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base break-words">
                          {bid.estudiante_nombre || `${bid.estudiante?.first_name} ${bid.estudiante?.last_name}`}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">
                          {bid.estudiante_email || bid.estudiante?.email}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                          {formatDateTime(bid.creado)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left xs:text-right">
                      <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 tabular-nums">{bid.cantidad} EC</p>
                      {index === 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Puja mas alta</p>
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
