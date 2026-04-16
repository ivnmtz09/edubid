"use client"

import { useState } from "react"
import { CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon, CalendarIcon } from "@heroicons/react/24/outline"
import { formatCoins, formatDateTime } from "../../utils/helpers"
import { TRANSACTION_TYPES } from "../../utils/constants"

const TransactionHistory = ({ transactions = [], className = "" }) => {
  const [filter, setFilter] = useState("all")

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true
    return transaction.type === filter
  })

  const getTransactionIcon = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.EARNED:
      case TRANSACTION_TYPES.ASSIGNED:
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />
      case TRANSACTION_TYPES.SPENT:
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.EARNED:
      case TRANSACTION_TYPES.ASSIGNED:
        return "text-green-600"
      case TRANSACTION_TYPES.SPENT:
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getTransactionText = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.EARNED:
        return "Ganado"
      case TRANSACTION_TYPES.ASSIGNED:
        return "Asignado"
      case TRANSACTION_TYPES.SPENT:
        return "Gastado"
      default:
        return "Transacción"
    }
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Historial de Transacciones</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input text-sm">
          <option value="all">Todas</option>
          <option value={TRANSACTION_TYPES.EARNED}>Ganadas</option>
          <option value={TRANSACTION_TYPES.SPENT}>Gastadas</option>
          <option value={TRANSACTION_TYPES.ASSIGNED}>Asignadas</option>
        </select>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getTransactionIcon(transaction.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>{formatDateTime(transaction.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === TRANSACTION_TYPES.SPENT ? "-" : "+"}
                  {formatCoins(transaction.amount)}
                </p>
                <p className="text-xs text-gray-500">{getTransactionText(transaction.type)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay transacciones</h3>
          <p className="text-gray-500">
            {filter === "all" ? "Aún no tienes transacciones" : "No hay transacciones de este tipo"}
          </p>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
