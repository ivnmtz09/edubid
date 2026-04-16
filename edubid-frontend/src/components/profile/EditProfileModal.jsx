"use client"

import { useState } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { authService } from "../../services/auth"

export default function EditProfileModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    bio: user.profile?.bio || "",
    telefono: user.profile?.telefono || "",
    institucion: user.profile?.institucion || "",
  })

  const mutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente")
      onClose()
      window.location.reload() // 🔁 Actualiza el perfil actual
    },
    onError: (err) => {
      toast.error(err.message || "Error al actualizar perfil")
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fondo difuminado */}
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor centrado */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal con efecto brillante naranja */}
        <div
          className="relative bg-white rounded-xl w-full max-w-lg shadow-lg border border-orange-400 
            shadow-[0_0_20px_4px_rgba(255,140,0,0.4)]
            before:content-[''] before:absolute before:inset-0 before:rounded-xl before:-z-10
            before:blur-2xl before:bg-gradient-to-r before:from-orange-500 before:to-amber-400 before:opacity-30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Editar Perfil
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="Ej: Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="3001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institución
                  </label>
                  <input
                    type="text"
                    name="institucion"
                    value={formData.institucion}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}