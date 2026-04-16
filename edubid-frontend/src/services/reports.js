import api from "./api"
import { API_ENDPOINTS } from "../utils/constants"

export const reportService = {
  async getReports(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.REPORTS, { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al obtener los reportes")
    }
  },

  async createReport(reportData) {
    try {
      const response = await api.post(API_ENDPOINTS.REPORTS, reportData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al crear el reporte")
    }
  },

  async getReport(reportId) {
    try {
      const response = await api.get(`${API_ENDPOINTS.REPORTS}${reportId}/`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al obtener el reporte")
    }
  },

  async downloadReport(reportId) {
    try {
      const response = await api.get(`${API_ENDPOINTS.REPORTS}${reportId}/download/`, {
        responseType: "blob",
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Error al descargar el reporte")
    }
  },
}
