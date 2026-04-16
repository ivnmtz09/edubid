import React, { useState } from "react"
import { DocumentTextIcon, UserCircleIcon } from "@heroicons/react/24/outline"

export default function SubmissionCard({ submission, onSave }) {
  const [editMode, setEditMode] = useState(false)
  const [calificacion, setCalificacion] = useState(submission.calificacion || "")
  const [retroalimentacion, setRetroalimentacion] = useState(submission.retroalimentacion || "")

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ calificacion, retroalimentacion })
    setEditMode(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="bg-purple-50 p-1.5 rounded-full flex-shrink-0 mt-1">
            <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {submission.estudiante_nombre}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {submission.estudiante_email}
            </p>
          </div>
        </div>
        
        {submission.archivo && (
          <a
            href={submission.archivo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors duration-200 w-fit"
          >
            <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Ver archivo</span>
          </a>
        )}
      </div>

      {editMode ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm text-gray-700 mb-1">Calificación: </label>
              <input
                type="number"
                value={calificacion}
                onChange={(e) => setCalificacion(e.target.value)}
                step="0.1"
                min="0"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-700 mb-1">Retroalimentación</label>
            <textarea
              value={retroalimentacion}
              onChange={(e) => setRetroalimentacion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition text-xs sm:text-sm"
            >
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-medium">Calificación:</span> {submission.calificacion ?? "Sin calificar"}
            </p>
            {!submission.calificacion && (
              <button
                onClick={() => setEditMode(true)}
                className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium"
              >
                Calificar
              </button>
            )}
          </div>
          
          {submission.retroalimentacion && (
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-medium">Retroalimentación:</span> {submission.retroalimentacion}
            </p>
          )}
          
          {submission.calificacion && (
            <button
              onClick={() => setEditMode(true)}
              className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium mt-1"
            >
              Editar calificación
            </button>
          )}
        </div>
      )}
    </div>
  )
}