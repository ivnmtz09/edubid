"use client"

import { useState } from "react"
import { useCreateClassroom } from "../../hooks/useClassrooms"
import toast from "react-hot-toast"

const CreateClassroom = ({ onClose }) => {
  const [form, setForm] = useState({ nombre: "", descripcion: "" })
  const { mutate: createClassroom, isPending } = useCreateClassroom()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre) return toast.error("El nombre es obligatorio")
    createClassroom(form, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Crear Nueva Clase</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateClassroom
