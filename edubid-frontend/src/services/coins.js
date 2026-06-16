import api from "./api"

export const coinsService = {
  getWallet: () => api.get("/api/tokens/wallets/"),
  getTransactions: () => api.get("/api/tokens/transactions/"),
  createTransaction: (data) => api.post("/api/tokens/transactions/", data),
  getPeriods: () => api.get("/api/tokens/periods/mis_periodos/"),
}
