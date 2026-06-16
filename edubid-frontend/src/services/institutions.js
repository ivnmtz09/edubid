import api from "./api"

export const institutionsService = {
  updateInstitution: async (id, formData) => {
    const res = await api.patch(`/api/institutions/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },
}
