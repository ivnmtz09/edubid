import api from "./api"

export const auctionService = {
  getAuctions: async (params = {}) => {
    const res = await api.get("/api/auctions/auctions/", { params })
    return res.data
  },

  getAuction: async (id) => {
    const res = await api.get(`/api/auctions/auctions/${id}/`)
    return res.data
  },

  createAuction: async (data) => {
    const res = await api.post("/api/auctions/auctions/", data)
    return res.data
  },

  updateAuction: async (id, data) => {
    const res = await api.patch(`/api/auctions/auctions/${id}/`, data)
    return res.data
  },

  deleteAuction: async (id) => {
    const res = await api.delete(`/api/auctions/auctions/${id}/`)
    return res.data
  },

  placeBid: async (auctionId, cantidad) => {
    const res = await api.post("/api/auctions/bids/", {
      auction: auctionId,
      cantidad: cantidad
    })
    return res.data
  },

  // NUEVO: Aumentar puja existente
  increaseBid: async (bidId, nuevaCantidad) => {
    const res = await api.post(`/api/auctions/bids/${bidId}/aumentar_puja/`, {
      nueva_cantidad: nuevaCantidad
    })
    return res.data
  },

  // NUEVO: Eliminar puja
  deleteBid: async (bidId) => {
    const res = await api.delete(`/api/auctions/bids/${bidId}/`)
    return res.data
  },

  getAuctionBids: async (auctionId) => {
    const res = await api.get(`/api/auctions/bids/por-subasta/${auctionId}/`)
    return res.data
  },

  closeAuction: async (id) => {
    const res = await api.post(`/api/auctions/auctions/${id}/close/`)
    return res.data
  },

  // NUEVO: Obtener estadísticas (puedes implementar este endpoint en tu backend)
  getAuctionStats: async () => {
    try {
      const res = await api.get("/api/auctions/stats/")
      return res.data
    } catch (error) {
      // Si el endpoint no existe, lanzar error para que se calcule localmente
      throw new Error("Stats endpoint not available")
    }
  }
}