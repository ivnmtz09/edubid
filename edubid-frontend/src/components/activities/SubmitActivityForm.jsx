import { useState } from "react"
import { useCreateSubmission } from "../../hooks/useActivities"
import Modal from "../common/Modal"
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import LoadingSpinner from "../common/LoadingSpinner"

export default function SubmitActivityForm({ activityId, onClose }) {
  const createMutation = useCreateSubmission()
  const [formData, setFormData] = useState({
    contenido: "",
    archivo: null
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert("El archivo no debe superar 10MB")
        return
      }
      setFormData({...formData, archivo: file})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const data = new FormData()
    data.append("activity", activityId)
    data.append("contenido", formData.contenido)
    if (formData.archivo) {
      data.append("archivo", formData.archivo)
    }

    try {
      await createMutation.mutateAsync(data)
      onClose()
    } catch (error) {
      console.error("Error enviando actividad:", error)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Entregar Actividad" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comentario / Respuesta
          </label>
          <textarea
            value={formData.contenido}
            onChange={(e) => setFormData({...formData, contenido: e.target.value})}
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base resize-none"
            placeholder="Escribe tu respuesta o comentarios aquí..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo Adjunto (Opcional)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="flex-1 cursor-pointer w-full">
              <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition">
                <DocumentArrowUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mr-2" />
                <span className="text-xs sm:text-sm text-gray-600 text-center">
                  {formData.archivo ? formData.archivo.name : "Seleccionar archivo (PDF, Word, Excel, Imágenes)"}
                </span>
              </div>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
              />
            </label>
            {formData.archivo && (
              <button
                type="button"
                onClick={() => setFormData({...formData, archivo: null})}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm w-full sm:w-auto"
              >
                Quitar
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Tamaño máximo: 10MB
          </p>
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
            disabled={createMutation.isPending}
            className="flex-1 bg-purple-500 text-white px-4 py-2.5 rounded-lg hover:bg-purple-600 transition disabled:opacity-50 text-sm sm:text-base flex items-center justify-center"
          >
            {createMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              "Enviar Entrega"
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}