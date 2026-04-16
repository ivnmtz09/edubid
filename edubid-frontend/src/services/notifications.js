import api from "./api"

export const notificationService = {
  async getNotifications(params = {}) {
    try {
      const response = await api.get('/api/notifications/', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al obtener las notificaciones")
    }
  },

  async markAsRead(notificationId) {
    try {
      const response = await api.post(`/api/notifications/${notificationId}/marcar-leida/`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al marcar como leída")
    }
  },

  async markAllAsRead() {
    try {
      const response = await api.post('/api/notifications/marcar-todas-leidas/')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al marcar todas como leídas")
    }
  },

  async deleteNotification(notificationId) {
    try {
      await api.delete(`/api/notifications/${notificationId}/`)
      return true
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al eliminar la notificación")
    }
  },

  async getUnread() {
    try {
      const response = await api.get('/api/notifications/no-leidas/')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al obtener no leídas")
    }
  },

  async getStats() {
    try {
      const response = await api.get('/api/notifications/estadisticas/')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al obtener estadísticas")
    }
  }
}