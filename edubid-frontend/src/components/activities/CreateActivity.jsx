import { useState } from "react"
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import { useCreateActivity } from "../../hooks/useActivities"
import { useGroups } from "../../hooks/useGroups"
import LoadingSpinner from "../common/LoadingSpinner"

export default function CreateActivity({ onClose }) {
  const createMutation = useCreateActivity()
  const { data: groups } = useGroups()
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "tarea",
    group: "",
    valor_educoins: 100,
    valor_notas: 10,
    fecha_entrega: "",
    habilitada: true
  })
  const [archivo, setArchivo] = useState(null)
  const [errors, setErrors] = useState({})

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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, archivo: "El archivo no debe superar 10MB" }))
        return
      }
      setArchivo(file)
      setErrors(prev => ({ ...prev, archivo: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }
    if (!formData.group) {
      newErrors.group = "El grupo es requerido"
    }
    if (!formData.fecha_entrega) {
      newErrors.fecha_entrega = "La fecha de entrega es requerida"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const data = new FormData()
      Object.keys(formData).forEach(key => {
        if (key === "fecha_entrega") {
          data.append(key, new Date(formData[key]).toISOString())
        } else if (key === "group") {
          data.append(key, parseInt(formData[key]))
        } else {
          data.append(key, formData[key])
        }
      })

      if (archivo) {
        data.append("archivo_adjunto", archivo)
      }

      await createMutation.mutateAsync(data)
      onClose()
    } catch (error) {
      console.error("Error creando actividad:", error)
    }
  }

  const minDate = new Date()
  const minDateString = minDate.toISOString().slice(0, 16)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la Actividad
        </label>
        <input
          type="text"
          name="nombre"
          required
          value={formData.nombre}
          onChange={handleChange}
          className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${
            errors.nombre ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Ej: Taller de Álgebra"
        />
        {errors.nombre && (
          <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            name="tipo"
            required
            value={formData.tipo}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="tarea">Tarea</option>
            <option value="examen">Examen</option>
            <option value="proyecto">Proyecto</option>
            <option value="quiz">Quiz</option>
            <option value="exposicion">Exposición</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grupo
          </label>
          <select
            name="group"
            required
            value={formData.group}
            onChange={handleChange}
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${
              errors.group ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Selecciona un grupo</option>
            {groups?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre}
              </option>
            ))}
          </select>
          {errors.group && (
            <p className="mt-1 text-sm text-red-600">{errors.group}</p>
          )}
        </div>
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
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base"
          placeholder="Describe la actividad..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Educoins
          </label>
          <input
            type="number"
            name="valor_educoins"
            required
            min="0"
            value={formData.valor_educoins}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Nota
          </label>
          <input
            type="number"
            name="valor_notas"
            required
            min="0"
            value={formData.valor_notas}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Límite
          </label>
          <input
            type="datetime-local"
            name="fecha_entrega"
            required
            value={formData.fecha_entrega}
            onChange={handleChange}
            min={minDateString}
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${
              errors.fecha_entrega ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.fecha_entrega && (
            <p className="mt-1 text-sm text-red-600">{errors.fecha_entrega}</p>
          )}
        </div>
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
                {archivo ? archivo.name : "Seleccionar archivo (PDF, Word, Excel, Imágenes)"}
              </span>
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
            />
          </label>
          {archivo && (
            <button
              type="button"
              onClick={() => setArchivo(null)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm w-full sm:w-auto"
            >
              Quitar
            </button>
          )}
        </div>
        {errors.archivo && (
          <p className="mt-1 text-sm text-red-600">{errors.archivo}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Tamaño máximo: 10MB
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="habilitada"
          name="habilitada"
          checked={formData.habilitada}
          onChange={handleChange}
          className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
        />
        <label htmlFor="habilitada" className="ml-2 text-sm text-gray-700">
          Actividad habilitada para entregas
        </label>
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
            "Crear Actividad"
          )}
        </button>
      </div>
    </form>
  )
}