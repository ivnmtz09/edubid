import api from "./api"
import { API_ENDPOINTS } from "../utils/constants"

export const classroomService = {
  // Obtener todas las clases (filtradas por rol en backend)
  getClassrooms: async () => {
    const res = await api.get(API_ENDPOINTS.CLASSROOMS)
    return res.data
  },

  // Obtener una clase específica
  getClassroom: async (id) => {
    const res = await api.get(API_ENDPOINTS.CLASSROOM_DETAIL(id))
    return res.data
  },

  // Crear clase (solo docentes)
  createClassroom: async (data) => {
    const res = await api.post(API_ENDPOINTS.CLASSROOMS, data)
    return res.data
  },

  // Actualizar clase (solo docente propietario)
  updateClassroom: async (id, data) => {
    const res = await api.patch(API_ENDPOINTS.CLASSROOM_DETAIL(id), data)
    return res.data
  },

  // Eliminar clase (solo docente propietario)
  deleteClassroom: async (id) => {
    const res = await api.delete(API_ENDPOINTS.CLASSROOM_DETAIL(id))
    return res.data
  },

  // Obtener estudiantes de una clase
  getClassroomStudents: async (id) => {
    const res = await api.get(API_ENDPOINTS.CLASSROOM_STUDENTS(id))
    return res.data
  },
}