import { useQuery } from "@tanstack/react-query"
import api from "../services/api"

export const useWallet = () => {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/tokens/wallets/")
        if (res.data.detail || !res.data.id) {
          return null
        }
        return res.data
      } catch (error) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const useAllWallets = () => {
  return useQuery({
    queryKey: ["all-wallets"],
    queryFn: async () => {
      const res = await api.get("/api/tokens/wallets/")
      if (Array.isArray(res.data)) {
        return res.data
      } else if (res.data.results) {
        return res.data.results
      }
      return []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const usePeriods = (enabled = true) => {
  return useQuery({
    queryKey: ["periods"],
    queryFn: async () => {
      const res = await api.get("/api/tokens/periods/mis_periodos/")
      return Array.isArray(res.data) ? res.data : []
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await api.get("/api/tokens/transactions/")

      let transactions = []
      if (Array.isArray(res.data)) {
        transactions = res.data
      } else if (res.data.results) {
        transactions = res.data.results
      }

      return transactions.map(transaction => ({
        id: transaction.id,
        tipo: transaction.tipo,
        monto: transaction.cantidad_educoins,
        descripcion: transaction.descripcion,
        fecha: transaction.creado,
        wallet: transaction.wallet
      }))
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const useTotalBalance = () => {
  const { data: allWallets, isLoading, error } = useAllWallets()

  const totalBalance = allWallets?.reduce((sum, wallet) => sum + (wallet.saldo_educoins || 0), 0) || 0

  return {
    data: totalBalance,
    isLoading,
    error
  }
}
