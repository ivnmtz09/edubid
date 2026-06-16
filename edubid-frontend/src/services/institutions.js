import axios from "axios"
import api from "./api"

export async function getPublicInstitutions() {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  const res = await axios.get(`${base}/api/institutions/public/`)
  return res.data
}

export const institutionsService = {
  list: async () => {
    const res = await api.get("/api/institutions/")
    return res.data
  },
  updateInstitution: async (id, payload) => {
    const res = await api.patch(`/api/institutions/${id}/`, payload)
    return res.data
  },
}
