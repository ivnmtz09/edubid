"use client"
import { useState } from "react"
import { useGradeSubmission } from "../../hooks/useSubmissions"
import LoadingSpinner from "../common/LoadingSpinner"

export default function GradeSubmissionModal({ submission, onClose }) {
  const [calificacion, setCalificacion] = useState("")
  const [retroalimentacion, setRetroalimentacion] = useState("")
  const grade = useGradeSubmission()

  const handleSubmit = (e) => {
    e.preventDefault()
    grade.mutate(
      { id: submission.id, data: { calificacion, retroalimentacion } },
      { onSuccess: onClose }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
        <input
          type="number"
          value={calificacion}
          onChange={(e) => setCalificacion(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          required
          min="0"
          max="5"
          step="0.1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Retroalimentación</label>
        <textarea
          value={retroalimentacion}
          onChange={(e) => setRetroalimentacion(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base resize-none"
          placeholder="Escribe tus comentarios para el estudiante..."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button 
          type="button" 
          onClick={onClose} 
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={grade.isPending}
          className="flex-1 bg-purple-500 text-white px-4 py-2.5 rounded-lg hover:bg-purple-600 transition disabled:opacity-50 text-sm sm:text-base flex items-center justify-center"
        >
          {grade.isPending ? <LoadingSpinner size="sm" /> : "Guardar Calificación"}
        </button>
      </div>
    </form>
  )
}