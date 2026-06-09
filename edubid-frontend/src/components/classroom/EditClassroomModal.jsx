import { useState, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useUpdateClassroom } from "../../hooks/useClassrooms"
import LoadingSpinner from "../common/LoadingSpinner"

export default function EditClassroomModal({ classroom, onClose }) {
  const updateMutation = useUpdateClassroom()
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: ""
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (classroom) {
      setFormData({
        nombre: classroom.nombre || "",
        descripcion: classroom.descripcion || ""
      })
    }
  }, [classroom])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: classroom.id,
        data: formData
      })
      onClose()
    } catch (error) {
      console.error("Error actualizando clase:", error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-sm border border-gray-200 dark:border-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Editar Clase
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de la Clase
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                  errors.nombre ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                }`}
                placeholder="Ej: Matemáticas 10A"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200"
                placeholder="Describe el contenido de la clase..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 active:scale-[0.96]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-yellow-600 text-white px-4 py-3 rounded-xl hover:bg-yellow-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center active:scale-[0.96]"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
