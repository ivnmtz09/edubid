import api from "./api"

export const coinsService = {
  getWallet: () => api.get("/coins/wallets/"),
  getTransactions: () => api.get("/coins/transactions/"),
  createTransaction: (data) => api.post("/coins/transactions/", data),
}
