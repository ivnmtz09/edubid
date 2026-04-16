"use client"

import { useState } from "react"
import { useAssignCoins } from "../../hooks/useActivities"
import LoadingSpinner from "../common/LoadingSpinner"

const AssignCoins = ({ activityId, students, onClose }) => {
  const assignCoins = useAssignCoins()
  const [selectedStudent, setSelectedStudent] = useState("")
  const [coins, setCoins] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedStudent) {
      setError("Selecciona un estudiante")
      return
    }

    if (!coins || coins <= 0) {
      setError("Ingresa una cantidad válida de Educoins")
      return
    }

    try {
      await assignCoins.mutateAsync({
        activityId,
        studentId: selectedStudent,
        coins: Number.parseInt(coins),
      })
      onClose()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleChange = (field, value) => {
    if (field === "student") {
      setSelectedStudent(value)
    } else if (field === "coins") {
      setCoins(value)
    }

    if (error) {
      setError("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="student" className="label">
          Estudiante
        </label>
        <select
          id="student"
          value={selectedStudent}
          onChange={(e) => handleChange("student", e.target.value)}
          className={`input ${error && !selectedStudent ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
          required
        >
          <option value="">Selecciona un estudiante</option>
          {students?.map((student) => (
            <option key={student.id} value={student.id}>
              {student.first_name} {student.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="coins" className="label">
          Cantidad de Educoins
        </label>
        <input
          type="number"
          id="coins"
          value={coins}
          onChange={(e) => handleChange("coins", e.target.value)}
          className={`input ${error && (!coins || coins <= 0) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
          placeholder="50"
          min="1"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={assignCoins.isPending} className="btn-primary flex-1">
          {assignCoins.isPending ? <LoadingSpinner size="sm" /> : "Asignar Educoins"}
        </button>
      </div>
    </form>
  )
}

export default AssignCoins
