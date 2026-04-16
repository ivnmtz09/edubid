import api from "./api"

// Obtener la wallet del usuario autenticado
export const getWallet = async () => {
  try {
    const res = await api.get("/api/coins/wallets/");
    // Si devuelve un array, tomar el primero
    if (Array.isArray(res.data)) {
      return res.data[0] || null;
    }
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export const createTransaction = (data) =>
  api.post("/api/coins/transactions/", data)