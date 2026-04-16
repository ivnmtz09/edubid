import { useState, useEffect } from "react"
import { XMarkIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import { useUpdateActivity } from "../../hooks/useActivities"
import { useGroups } from "../../hooks/useGroups"
import LoadingSpinner from "../common/LoadingSpinner"

export default function EditActivityModal({ activity, onClose }) {
  const updateMutation = useUpdateActivity()
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

  useEffect(() => {
    if (activity) {
      setFormData({
        nombre: activity.nombre || "",
        descripcion: activity.descripcion || "",
        tipo: activity.tipo || "tarea",
        group: activity.group || "",
        valor_educoins: activity.valor_educoins || 100,
        valor_notas: activity.valor_notas || 10,
        fecha_entrega: activity.fecha_entrega 
          ? new Date(activity.fecha_entrega).toISOString().slice(0, 16)
          : "",
        habilitada: activity.habilitada !== undefined ? activity.habilitada : true
      })
    }
  }, [activity])

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

      await updateMutation.mutateAsync({
        id: activity.id,
        data
      })
      onClose()
    } catch (error) {
      console.error("Error actualizando actividad:", error)
    }
  }

  const minDate = new Date()
  const minDateString = minDate.toISOString().slice(0, 16)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-opacity-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl w-full max-w-2xl shadow-lg border border-purple-200 shadow-purple-500/10 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Editar Actividad
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Actividad
              </label>
              <input
                type="text"
                name="nombre"
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
                Archivo Adjunto
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="flex-1 cursor-pointer w-full">
                  <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition">
                    <DocumentArrowUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mr-2" />
                    <span className="text-xs sm:text-sm text-gray-600 text-center">
                      {archivo ? archivo.name : "Seleccionar archivo"}
                    </span>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.archivo && (
                <p className="mt-1 text-sm text-red-600">{errors.archivo}</p>
              )}
              {activity.archivo_adjunto && !archivo && (
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Archivo actual: 
                  <a 
                    href={activity.archivo_adjunto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline ml-1"
                  >
                    Ver archivo
                  </a>
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="habilitada"
                name="habilitada"
                checked={formData.habilitada}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="habilitada" className="ml-2 block text-sm text-gray-700">
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
                disabled={updateMutation.isPending}
                className="flex-1 bg-purple-500 text-white px-4 py-2.5 rounded-lg hover:bg-purple-600 transition disabled:opacity-50 text-sm sm:text-base flex items-center justify-center"
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