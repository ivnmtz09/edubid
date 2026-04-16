"use client"

import { useState } from "react"
import { useCreateGroup } from "../../hooks/useGroups"
import { useClassrooms } from "../../hooks/useClassrooms"
import toast from "react-hot-toast"
import { XMarkIcon } from "@heroicons/react/24/outline"
import LoadingSpinner from "../common/LoadingSpinner"

const CreateGroup = ({ onClose }) => {
  const [form, setForm] = useState({ 
    nombre: "", 
    descripcion: "", 
    classroom: "" 
  })
  const { data: classrooms, isLoading: classroomsLoading } = useClassrooms()
  const { mutate: createGroup, isPending } = useCreateGroup()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      return toast.error("El nombre del grupo es obligatorio")
    }
    if (!form.classroom) {
      return toast.error("Debes seleccionar una clase")
    }
    
    createGroup(form, { 
      onSuccess: () => {
        toast.success("Grupo creado exitosamente")
        onClose()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Error al crear el grupo")
      }
    })
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Crear Nuevo Grupo
            </h2>
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
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Grupo de Matemáticas Avanzadas"
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={3}
                placeholder="Describe el propósito del grupo..."
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none text-sm sm:text-base"
              />
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
                  value={form.classroom}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm sm:text-base"
                  required
                >
                  <option value="">Selecciona una clase</option>
                  {classrooms?.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nombre}
                    </option>
                  ))}
                </select>
              )}
              {classrooms?.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  No tienes clases creadas. Primero crea una clase para poder asociar el grupo.
                </p>
              )}
            </div>

            {/* Footer Actions */}
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
                disabled={isPending || !form.nombre.trim() || !form.classroom}
                className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creando...
                  </>
                ) : (
                  "Crear Grupo"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateGroup