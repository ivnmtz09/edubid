import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  BellIcon, 
  CheckIcon,
  ClockIcon,
  CurrencyEuroIcon,
  TrophyIcon,
  AcademicCapIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  EllipsisHorizontalIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import api from '../../services/api'
import { formatDateTime, formatRelativeTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState('all')
  const [showActions, setShowActions] = useState(false)
  const dropdownRef = useRef(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/notifications/')
        let notifications = []
        if (Array.isArray(res.data)) {
          notifications = res.data
        } else if (res.data.results && Array.isArray(res.data.results)) {
          notifications = res.data.results
        } else if (res.data.notificaciones && Array.isArray(res.data.notificaciones)) {
          notifications = res.data.notificaciones
        }
        return notifications
      } catch (error) {
        return []
      }
    },
    refetchInterval: 15000,
    retry: 3,
    staleTime: 10000,
  })

  const notifications = notificationsData || []
  
  const filteredNotifications = viewMode === 'unread' 
    ? notifications.filter(n => !n.leida)
    : notifications

  const unreadCount = notifications.filter(n => !n.leida).length

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.post(`/api/notifications/${id}/marcar-leida/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Error al marcar como leida')
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/notifications/marcar-todas-leidas/')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Todas las notificaciones marcadas como leidas')
    },
    onError: () => {
      toast.error('Error al marcar todas como leidas')
    }
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/notifications/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificacion eliminada')
    },
    onError: () => {
      toast.error('Error al eliminar notificacion')
    }
  })

  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const readNotifications = notifications.filter(n => n.leida)
      await Promise.all(
        readNotifications.map(notification => 
          api.delete(`/api/notifications/${notification.id}/`)
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificaciones leidas eliminadas')
    },
    onError: () => {
      toast.error('Error al eliminar notificaciones')
    }
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowActions(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const getNotificationIcon = (tipo) => {
    const baseClasses = "h-4 w-4"
    
    switch (tipo) {
      case 'actividad':
        return <ClipboardDocumentListIcon className={`${baseClasses} text-blue-600 dark:text-blue-400`} />
      case 'calificacion':
        return <CheckIcon className={`${baseClasses} text-green-600 dark:text-green-400`} />
      case 'monedas':
        return <CurrencyEuroIcon className={`${baseClasses} text-orange-600 dark:text-orange-400`} />
      case 'subasta_nueva':
        return <TrophyIcon className={`${baseClasses} text-purple-600 dark:text-purple-400`} />
      case 'subasta_ganada':
        return <CheckBadgeIcon className={`${baseClasses} text-green-600 dark:text-green-400`} />
      case 'anuncio':
        return <ExclamationTriangleIcon className={`${baseClasses} text-orange-600 dark:text-orange-400`} />
      case 'account_security':
        return <ExclamationTriangleIcon className={`${baseClasses} text-red-600 dark:text-red-400`} />
      default:
        return <BellIcon className={`${baseClasses} text-gray-500 dark:text-gray-400`} />
    }
  }

  const getNotificationColor = (tipo) => {
    switch (tipo) {
      case 'actividad':
        return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800/50'
      case 'calificacion':
        return 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800/50'
      case 'monedas':
        return 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800/50'
      case 'subasta_nueva':
        return 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800/50'
      case 'subasta_ganada':
        return 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800/50'
      case 'anuncio':
        return 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800/50'
      case 'account_security':
        return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800/50'
      default:
        return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.leida) {
      markAsReadMutation.mutate(notification.id)
    }

    let targetUrl = null
    
    if (notification.activity_id) {
      targetUrl = `/activities/${notification.activity_id}`
    } else if (notification.auction_id) {
      targetUrl = `/auctions/${notification.auction_id}`
    } else if (notification.grade_id) {
      targetUrl = '/activities'
    } else if (notification.tipo === 'monedas') {
      targetUrl = '/wallet'
    }

    if (targetUrl) {
      navigate(targetUrl)
    } else {
      switch (notification.tipo) {
        case 'actividad':
          navigate('/activities')
          break
        case 'calificacion':
          navigate('/activities')
          break
        case 'subasta_nueva':
        case 'subasta_ganada':
          navigate('/auctions')
          break
        case 'monedas':
          navigate('/wallet')
          break
        default:
          break
      }
    }
    
    setIsOpen(false)
    setShowActions(false)
  }

  const getPriority = (notification) => {
    if (!notification.leida) return 1
    const created = new Date(notification.creado)
    const now = new Date()
    const hoursDiff = (now - created) / (1000 * 60 * 60)
    if (hoursDiff < 1) return 2
    return 3
  }

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const priorityA = getPriority(a)
    const priorityB = getPriority(b)
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    return new Date(b.creado) - new Date(a.creado)
  })

  const getDropdownStyles = () => {
    if (typeof window === 'undefined') return { 
      width: 'calc(100vw - 2rem)', 
      maxWidth: '400px',
      position: 'left-1/2 transform -translate-x-1/2' 
    }
    
    const width = window.innerWidth
    
    if (width < 768) {
      return {
        width: 'calc(100vw - 1.5rem)',
        maxWidth: '400px',
        position: 'left-1/2 transform -translate-x-1/2'
      }
    }
    
    if (width < 1024) {
      return {
        width: '28rem',
        maxWidth: 'none',
        position: 'right-0'
      }
    }
    
    if (width < 1440) {
      return {
        width: '32rem',
        maxWidth: 'none',
        position: 'right-0'
      }
    }
    
    return {
      width: '36rem',
      maxWidth: 'none',
      position: 'right-0'
    }
  }

  const dropdownStyles = getDropdownStyles()

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-200 touch-manipulation active:scale-[0.96] ${
          isOpen 
            ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
        aria-label="Notificaciones"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 h-4 w-4 text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-gray-900 ${
            unreadCount > 9 
              ? 'bg-red-500 text-white text-[8px]' 
              : 'bg-orange-500 text-white'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className={`fixed sm:absolute ${dropdownStyles.position} mt-2 shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col transform transition-all duration-200 bg-white dark:bg-gray-800 rounded-xl overflow-hidden`}
          style={{ 
            width: dropdownStyles.width,
            maxWidth: dropdownStyles.maxWidth
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">Notificaciones</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-full">
                    {unreadCount} sin leer
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {notifications.length} total
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="sm:hidden">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400 touch-manipulation active:scale-[0.96]"
                  title="Mas acciones"
                >
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => setViewMode(viewMode === 'all' ? 'unread' : 'all')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400 active:scale-[0.96]"
                  title={viewMode === 'all' ? 'Ver solo no leidas' : 'Ver todas'}
                >
                  {viewMode === 'all' ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400 active:scale-[0.96]"
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          {(unreadCount > 0 || notifications.some(n => n.leida)) && (
            <div className={`${showActions ? 'flex' : 'hidden'} sm:flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50`}>
              <div className="flex items-center gap-2 flex-wrap">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-xs text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 font-medium disabled:opacity-50 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition flex items-center gap-1 touch-manipulation min-h-[44px] active:scale-[0.96]"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span>Marcar todas</span>
                  </button>
                )}
                
                <div className="sm:hidden">
                  <button
                    onClick={() => setViewMode(viewMode === 'all' ? 'unread' : 'all')}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-1 touch-manipulation min-h-[44px] active:scale-[0.96]"
                  >
                    {viewMode === 'all' ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    <span>{viewMode === 'all' ? 'Solo no leidas' : 'Ver todas'}</span>
                  </button>
                </div>
              </div>
              
              {notifications.some(n => n.leida) && (
                <button
                  onClick={() => deleteAllReadMutation.mutate()}
                  disabled={deleteAllReadMutation.isPending}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center gap-1 touch-manipulation min-h-[44px] active:scale-[0.96]"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Eliminar leidas</span>
                  <span className="sm:hidden">Limpiar</span>
                </button>
              )}
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 dark:border-orange-400 mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando notificaciones...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 px-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 dark:text-red-400 text-sm">Error al cargar notificaciones</p>
                <button 
                  onClick={() => queryClient.invalidateQueries(['notifications'])}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 mt-2 touch-manipulation active:scale-[0.96]"
                >
                  Reintentar
                </button>
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <BellIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {viewMode === 'unread' ? 'No hay notificaciones sin leer' : 'No tienes notificaciones'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {viewMode === 'unread' 
                    ? 'Buen trabajo! Estas al dia con todo.' 
                    : 'Aqui veras tus actividades, calificaciones y mas'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 relative group border-l-4 ${
                      !notification.leida 
                        ? 'bg-orange-50/50 dark:bg-orange-500/5 border-l-orange-500' 
                        : 'border-l-transparent'
                    }`}
                  >
                    <div 
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 ${
                        (notification.activity_id || notification.auction_id || notification.grade_id || notification.tipo === 'monedas')
                          ? 'cursor-pointer touch-manipulation'
                          : 'cursor-default'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 border ${getNotificationColor(notification.tipo)}`}>
                        {getNotificationIcon(notification.tipo)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-medium line-clamp-2 break-words ${
                            !notification.leida ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.titulo}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.leida && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                            )}
                            {(notification.activity_id || notification.auction_id) && (
                              <ArrowRightIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mt-0.5" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mb-2 break-words">
                          {notification.mensaje}
                        </p>
                        
                        {/* Metadata */}
                        {notification.metadata && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {notification.metadata.nota && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">
                                Nota: {notification.metadata.nota}
                              </span>
                            )}
                            {notification.metadata.cantidad && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 tabular-nums">
                                +{notification.metadata.cantidad} EC
                              </span>
                            )}
                            {notification.metadata.valor_educoins && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 tabular-nums">
                                {notification.metadata.valor_educoins} EC
                              </span>
                            )}
                            {notification.metadata.valor_minimo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 tabular-nums">
                                Minimo: {notification.metadata.valor_minimo} EC
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate tabular-nums">
                            {notification.tiempo_transcurrido || formatRelativeTime(notification.creado)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="absolute top-3 right-3 hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.leida && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsReadMutation.mutate(notification.id)
                          }}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 touch-manipulation active:scale-[0.96]"
                          title="Marcar como leida"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotificationMutation.mutate(notification.id)
                        }}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 touch-manipulation active:scale-[0.96]"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="sm:hidden flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {!notification.leida && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsReadMutation.mutate(notification.id)
                          }}
                          className="flex-1 text-xs text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 font-medium py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 transition flex items-center justify-center gap-1 touch-manipulation min-h-[44px] active:scale-[0.96]"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Leida
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotificationMutation.mutate(notification.id)
                        }}
                        className="flex-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center justify-center gap-1 touch-manipulation min-h-[44px] active:scale-[0.96]"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {sortedNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {viewMode === 'unread' 
                    ? `${unreadCount} sin leer` 
                    : `${sortedNotifications.length} total`
                  }
                </p>
                {viewMode === 'all' && unreadCount > 0 && (
                  <button
                    onClick={() => setViewMode('unread')}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium touch-manipulation active:scale-[0.96]"
                  >
                    Ver solo sin leer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsDropdown
