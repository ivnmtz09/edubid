import { useState, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useUpdateGroup } from "../../hooks/useGroups"
import { useClassrooms } from "../../hooks/useClassrooms"
import LoadingSpinner from "../common/LoadingSpinner"

export default function EditGroupModal({ group, onClose }) {
  const updateMutation = useUpdateGroup()
  const { data: classrooms, isLoading: classroomsLoading } = useClassrooms()
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    classroom: "",
    activo: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (group) {
      setFormData({
        nombre: group.nombre || "",
        descripcion: group.descripcion || "",
        classroom: group.classroom?.id || group.classroom || "",
        activo: group.activo !== undefined ? group.activo : true
      })
    }
  }, [group])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
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
    if (!formData.classroom) {
      newErrors.classroom = "La clase es requerida"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: group.id,
        data: {
          ...formData,
          classroom: parseInt(formData.classroom)
        }
      })
      onClose()
    } catch (error) {
      console.error("Error actualizando grupo:", error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-opacity-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div 
          className="relative bg-white rounded-xl sm:rounded-2xl w-full max-w-md shadow-lg border border-blue-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Editar Grupo
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Grupo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm sm:text-base ${
                  errors.nombre ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ej: Grupo A - Matemáticas"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clase Asociada <span className="text-red-500">*</span>
              </label>
              {classroomsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <select
                  name="classroom"
                  value={formData.classroom}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm sm:text-base ${
                    errors.classroom ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecciona una clase</option>
                  {classrooms?.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.nombre}
                    </option>
                  ))}
                </select>
              )}
              {errors.classroom && (
                <p className="mt-1 text-sm text-red-600">{errors.classroom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none text-sm sm:text-base"
                placeholder="Describe el grupo..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                Grupo activo
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base flex items-center justify-center gap-2"
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