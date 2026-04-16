"use client"
import { useState } from "react"
import { useCreateSubmission } from "../../hooks/useSubmissions"
import LoadingSpinner from "../common/LoadingSpinner"
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"

export default function SubmitActivity({ activityId }) {
  const [contenido, setContenido] = useState("")
  const [archivo, setArchivo] = useState(null)
  const createSubmission = useCreateSubmission()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert("El archivo no debe superar 10MB")
        return
      }
      setArchivo(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const formData = new FormData()
    formData.append("activity", activityId)
    formData.append("contenido", contenido)
    if (archivo) {
      formData.append("archivo", archivo)
    }

    createSubmission.mutate(formData, {
      onSuccess: () => {
        setContenido("")
        setArchivo(null)
        // Reset file input
        const fileInput = document.getElementById('file-input')
        if (fileInput) fileInput.value = ''
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Campo de texto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
          Tu respuesta
        </label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe tu respuesta, comentarios o descripción de la entrega aquí..."
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base"
          rows={5}
          required
        />
      </div>

      {/* Campo de archivo opcional */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
          Archivo adjunto (opcional)
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="flex-1 cursor-pointer w-full">
            <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors duration-200">
              <DocumentArrowUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="text-center sm:text-left">
                <span className="text-xs sm:text-sm text-gray-600 block">
                  {archivo ? archivo.name : "Haz clic para seleccionar un archivo"}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">
                  PDF, Word, Excel, PowerPoint, imágenes (max. 10MB)
                </span>
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.txt"
            />
          </label>
          
          {archivo && (
            <button
              type="button"
              onClick={() => {
                setArchivo(null)
                const fileInput = document.getElementById('file-input')
                if (fileInput) fileInput.value = ''
              }}
              className="px-3 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium border border-red-200 w-full sm:w-auto"
            >
              Quitar archivo
            </button>
          )}
        </div>
      </div>

      {/* Botón de envío */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={createSubmission.isPending || !contenido.trim()}
          className="flex items-center justify-center gap-2 bg-purple-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base w-full sm:w-auto sm:flex-1"
        >
          {createSubmission.isPending ? (
            <>
              <LoadingSpinner size="sm" />
              Enviando...
            </>
          ) : (
            <>
              <DocumentArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Enviar Entrega
            </>
          )}
        </button>
        
        {archivo && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <DocumentArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-900 truncate">
                  {archivo.name}
                </p>
                <p className="text-xs text-purple-600">
                  {(archivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de estado */}
      {createSubmission.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-red-700 text-xs sm:text-sm">
            Error al enviar la entrega. Por favor, intenta nuevamente.
          </p>
        </div>
      )}

      {createSubmission.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <p className="text-green-700 text-xs sm:text-sm">
            ¡Entrega enviada correctamente!
          </p>
        </div>
      )}
    </form>
  )
}