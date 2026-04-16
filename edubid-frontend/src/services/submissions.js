import api from "./api"

export const getSubmissions = async (activityId) => {
  const res = await api.get(`/submissions/?activity=${activityId}`)
  return res.data
}

export const createSubmission = async (formData) => {
  const res = await api.post("/submissions/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export const updateSubmission = async ({ id, data }) => {
  const res = await api.patch(`/submissions/${id}/`, data)
  return res.data
}
