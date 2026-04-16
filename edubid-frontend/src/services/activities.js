import api from "./api"
import { API_ENDPOINTS } from "../utils/constants"

export const activityService = {
  getActivities: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.ACTIVITIES, { params })
    return res.data
  },

  getActivity: async (id) => {
    const res = await api.get(API_ENDPOINTS.ACTIVITY_DETAIL(id))
    return res.data
  },

  createActivity: async (data) => {
    const res = await api.post(API_ENDPOINTS.ACTIVITIES, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },

  updateActivity: async (id, data) => {
    const res = await api.patch(API_ENDPOINTS.ACTIVITY_DETAIL(id), data)
    return res.data
  },

  deleteActivity: async (id) => {
    const res = await api.delete(API_ENDPOINTS.ACTIVITY_DETAIL(id))
    return res.data
  },

  getActivitySubmissions: async (activityId) => {
    const res = await api.get(API_ENDPOINTS.SUBMISSIONS, {
      params: { activity: activityId }
    })
    return res.data
  },
}

export const submissionService = {
  getSubmissions: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.SUBMISSIONS, { params })
    return res.data
  },

  getSubmission: async (id) => {
    const res = await api.get(API_ENDPOINTS.SUBMISSION_DETAIL(id))
    return res.data
  },

  createSubmission: async (formData) => {
    const res = await api.post(API_ENDPOINTS.SUBMISSIONS, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },

  updateSubmission: async (id, data) => {
    const res = await api.patch(API_ENDPOINTS.SUBMISSION_DETAIL(id), data)
    return res.data
  },

  // NUEVO: Cancelar submission
  cancelSubmission: async (id) => {
    const res = await api.delete(API_ENDPOINTS.SUBMISSION_DETAIL(id))
    return res.data
  },

  gradeSubmission: async (id, data) => {
    const res = await api.patch(API_ENDPOINTS.SUBMISSION_GRADE(id), data)
    return res.data
  },
}