import api from "./api"

export const googleAuthService = {
  async loginWithGoogle(id_token) {
    const response = await api.post("/api/users/google/", { id_token })
    const { tokens, user } = response.data
    localStorage.setItem("access_token", tokens.access)
    localStorage.setItem("refresh_token", tokens.refresh)
    localStorage.setItem("user", JSON.stringify(user))
    return { user, tokens }
  },
}
