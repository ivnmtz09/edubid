"use client"

import { useState } from "react"
import { useGradeSubmission } from "../../hooks/useSubmissions"
import LoadingSpinner from "../common/LoadingSpinner"
import { 
  StarIcon, 
  ChatBubbleLeftRightIcon, 
  CurrencyEuroIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline"

export default function GradeSubmission({ submission, onClose }) {
  const gradeSubmission = useGradeSubmission()
  const [formData, setFormData] = useState({
    calificacion: submission?.calificacion || "",
    retroalimentacion: submission?.retroalimentacion || "",
    educoins: submission?.educoins || submission?.activity?.valor_educoins || "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.calificacion || !formData.educoins) {
      alert("Por favor completa la calificación y los Educoins")
      return
    }

    try {
      await gradeSubmission.mutateAsync({
        submissionId: submission.id,
        calificacion: parseFloat(formData.calificacion),
        retroalimentacion: formData.retroalimentacion,
        educoins: parseInt(formData.educoins),
      })
      onClose()
    } catch (error) {
      console.error("Error calificando:", error)
    }
  }

  const maxGrade = submission?.activity?.valor_notas || 5
  const maxEducoins = submission?.activity?.valor_educoins || 100

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del estudiante */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 text-sm mb-2">Información del Estudiante</h4>
        <p className="text-sm text-blue-700">
          {submission?.estudiante_nombre || submission?.estudiante?.first_name} {submission?.estudiante?.last_name}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Actividad: {submission?.activity_title || submission?.activity?.nombre}
        </p>
      </div>

      {/* Calificación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-yellow-500" />
          Calificación (0-{maxGrade})
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            min="0"
            max={maxGrade}
            name="calificacion"
            value={formData.calificacion}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder={`Ej: 4.5 (máx: ${maxGrade})`}
            required
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            /{maxGrade}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Valor de la actividad: {maxGrade} puntos
        </p>
      </div>

      {/* Educoins */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <CurrencyEuroIcon className="h-5 w-5 text-orange-500" />
          Educoins a otorgar
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            max={maxEducoins}
            name="educoins"
            value={formData.educoins}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            placeholder={`Ej: 50 (máx: ${maxEducoins})`}
            required
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            EC
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Valor máximo disponible: {maxEducoins} Educoins
        </p>
      </div>

      {/* Retroalimentación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-500" />
          Retroalimentación
        </label>
        <textarea
          name="retroalimentacion"
          rows={4}
          value={formData.retroalimentacion}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
          placeholder="Escribe una retroalimentación constructiva para el estudiante..."
        />
        <p className="text-xs text-gray-500 mt-2">
          {formData.retroalimentacion.length}/500 caracteres
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Resumen de Calificación</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Calificación:</span>
            <div className="font-semibold text-blue-600">
              {formData.calificacion || "0"}/{maxGrade}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Educoins:</span>
            <div className="font-semibold text-orange-600">
              {formData.educoins || "0"} EC
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
        >
          <XCircleIcon className="h-5 w-5" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={gradeSubmission.isPending || !formData.calificacion || !formData.educoins}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {gradeSubmission.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Guardar Calificación
            </>
          )}
        </button>
      </div>
    </form>
  )
}