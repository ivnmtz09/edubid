// Helper functions específicas para subastas

export const getAuctionStatus = (auction) => {
  const now = new Date()
  const endDate = new Date(auction.fecha_fin)
  
  if (auction.estado === 'closed') {
    return { status: 'closed', label: 'Cerrada', color: 'gray' }
  }
  
  if (endDate < now) {
    return { status: 'expired', label: 'Expirada', color: 'red' }
  }
  
  return { status: 'active', label: 'Activa', color: 'green' }
}

export const getMinNextBid = (bids) => {
  if (!bids || bids.length === 0) return 1
  const highestBid = bids[0] // Las bids vienen ordenadas por cantidad descendente
  return highestBid.cantidad + 1
}

export const canUserBid = (user, auction, wallet, existingBid) => {
  if (!user || !auction) return false
  
  const status = getAuctionStatus(auction)
  if (status.status !== 'active') return false
  
  if (user.role !== 'estudiante') return false
  
  // Si ya tiene una puja, solo puede aumentarla
  if (existingBid) {
    return true // Puede aumentar
  }
  
  // Para nueva puja, verificar saldo disponible
  if (!wallet) return false
  
  const availableBalance = wallet.saldo - wallet.bloqueado
  return availableBalance > 0
}

export const formatAuctionTimeRemaining = (fechaFin) => {
  const now = new Date()
  const endDate = new Date(fechaFin)
  const diffMs = endDate - now
  
  if (diffMs <= 0) return 'Finalizada'
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`
  } else {
    return `${diffMinutes}m`
  }
}

export const getBidStatus = (bid, bids) => {
  if (!bids || bids.length === 0) return 'only'
  
  const highestBid = bids[0]
  if (bid.id === highestBid.id) {
    return 'winning'
  } else {
    return 'outbid'
  }
}

// Colores para la interfaz - Tono verde principal
export const AUCTION_COLORS = {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Verde principal
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  status: {
    active: '#22c55e',    // Verde
    expired: '#ef4444',   // Rojo
    closed: '#6b7280',    // Gris
    winning: '#10b981',   // Verde éxito
    outbid: '#f59e0b',    // Ámbar
  }
}

// Breakpoints para responsividad
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}