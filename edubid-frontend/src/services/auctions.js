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

  placeBid: async (auctionId, cantidad_educoins, estudiante = null) => {
    const data = { auction: auctionId, cantidad_educoins }
    if (estudiante) data.estudiante = estudiante
    const res = await api.post("/api/auctions/bids/", data)
    return res.data
  },

  increaseBid: async (auctionId, cantidad_educoins, estudiante = null) => {
    const data = { auction: auctionId, cantidad_educoins }
    if (estudiante) data.estudiante = estudiante
    const res = await api.post("/api/auctions/bids/", data)
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
}
