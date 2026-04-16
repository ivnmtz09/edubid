import api from "./api"
import { API_ENDPOINTS } from "../utils/constants"

export const groupsService = {
  async getGroups() {
    const res = await api.get(API_ENDPOINTS.GROUPS)
    const groups = res.data
    
    console.log("Grupos recibidos en servicio:", groups); // Debug
    
    return groups;
  },

  async getGroup(id) {
    const res = await api.get(`/api/groups/${id}/`)
    let groupData = res.data;
    
    console.log("Grupo detalle recibido:", groupData); // Debug

    // Si no hay estudiantes, intentar obtenerlos del endpoint específico
    if (!groupData.estudiantes || groupData.estudiantes.length === 0) {
      try {
        const studentsRes = await api.get(`/api/groups/${id}/estudiantes/`)
        groupData.estudiantes = studentsRes.data;
      } catch (error) {
        console.error("Error obteniendo estudiantes:", error)
        groupData.estudiantes = []
      }
    }
    
    return groupData
  },

  async getGroup(id) {
    const res = await api.get(API_ENDPOINTS.GROUP_DETAIL(id))
    const group = res.data
    
    // Si el grupo no tiene estudiantes en la respuesta, los obtenemos por separado
    if (!group.estudiantes || group.estudiantes.length === 0) {
      try {
        const studentsRes = await api.get(`/api/groups/${id}/estudiantes/`)
        group.estudiantes = studentsRes.data
      } catch (error) {
        console.error(`Error obteniendo estudiantes del grupo ${id}:`, error)
        group.estudiantes = []
      }
    }
    
    // Si classroom es solo un ID, obtenemos los detalles
    if (group.classroom && typeof group.classroom === 'number') {
      try {
        const classroomRes = await api.get(`/api/classrooms/${group.classroom}/`)
        group.classroom = classroomRes.data
      } catch (error) {
        console.error(`Error obteniendo classroom ${group.classroom}:`, error)
        group.classroom = { id: group.classroom, nombre: "Sin clase asignada" }
      }
    }
    
    return group
  },

  async createGroup(data) {
    const res = await api.post(API_ENDPOINTS.GROUPS, data)
    return res.data
  },

  async updateGroup(id, data) {
    const res = await api.patch(API_ENDPOINTS.GROUP_DETAIL(id), data)
    return res.data
  },

  async deleteGroup(id) {
    const res = await api.delete(API_ENDPOINTS.GROUP_DETAIL(id))
    return res.data
  },

  async joinGroup(code) {
    const res = await api.post(API_ENDPOINTS.GROUP_JOIN_BY_CODE, { code })
    return res.data
  },

  async getGroupStudents(id) {
    try {
      const res = await api.get(`/api/groups/${id}/estudiantes/`)
      return res.data
    } catch (error) {
      console.error(`Error obteniendo estudiantes del grupo ${id}:`, error)
      return []
    }
  },
}