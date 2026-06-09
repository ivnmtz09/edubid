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
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-sm border border-gray-200 dark:border-white/5">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Crear Nueva Clase</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-[0.96]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all duration-200 font-medium active:scale-[0.96]"
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
