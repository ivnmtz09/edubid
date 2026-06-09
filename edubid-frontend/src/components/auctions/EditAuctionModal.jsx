import { useState, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useUpdateAuction } from "../../hooks/useAuctions"
import { useQuery } from "@tanstack/react-query"
import api from "../../services/api"
import LoadingSpinner from "../common/LoadingSpinner"

export default function EditAuctionModal({ auction, onClose }) {
  const updateMutation = useUpdateAuction()
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    grupo: "",
    fecha_fin: "",
    valor_minimo: 1,
    incremento_minimo: 10,
  })
  const [errors, setErrors] = useState({})

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/api/groups/")
      return res.data
    },
  })

  useEffect(() => {
    if (auction) {
      setFormData({
        titulo: auction.titulo || "",
        descripcion: auction.descripcion || "",
        grupo: auction.grupo?.id || auction.grupo || "",
        fecha_fin: auction.fecha_fin ? new Date(auction.fecha_fin).toISOString().slice(0, 16) : "",
        valor_minimo: auction.valor_minimo ?? 1,
        incremento_minimo: auction.incremento_minimo ?? 10,
      })
    }
  }, [auction])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.titulo) newErrors.titulo = "El titulo es requerido"
    if (!formData.descripcion) newErrors.descripcion = "La descripcion es requerida"
    if (!formData.grupo) newErrors.grupo = "Debes seleccionar un grupo"
    if (!formData.fecha_fin) newErrors.fecha_fin = "La fecha de finalizacion es requerida"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const submitData = {
        ...formData,
        grupo: parseInt(formData.grupo),
        fecha_fin: new Date(formData.fecha_fin).toISOString(),
      }

      await updateMutation.mutateAsync({ id: auction.id, data: submitData })
      onClose()
    } catch (error) {
      console.error("Error actualizando subasta:", error)
      if (error.response?.data) {
        const backendErrors = error.response.data
        Object.keys(backendErrors).forEach(key => {
          setErrors(prev => ({ 
            ...prev, 
            [key]: Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key] 
          }))
        })
      }
    }
  }

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + 1)
  const minDateString = minDate.toISOString().slice(0, 16)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-lg border border-gray-200 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Editar Subasta
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.96]"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titulo de la Subasta
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                  errors.titulo ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.titulo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titulo}</p>}
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripcion
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                value={formData.descripcion}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                  errors.descripcion ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.descripcion && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descripcion}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="grupo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grupo
                </label>
                <select
                  id="grupo"
                  name="grupo"
                  value={formData.grupo}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                    errors.grupo ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <option value="">Selecciona un grupo</option>
                  {groups?.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nombre} - {group.classroom_nombre || 'Sin clase'}
                    </option>
                  ))}
                </select>
                {errors.grupo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.grupo}</p>}
              </div>

              <div>
                <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Finalizacion
                </label>
                <input
                  type="datetime-local"
                  id="fecha_fin"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                    errors.fecha_fin ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                  min={minDateString}
                />
                {errors.fecha_fin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fecha_fin}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor_minimo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Puja inicial minima
                </label>
                <input
                  type="number"
                  id="valor_minimo"
                  name="valor_minimo"
                  value={formData.valor_minimo}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="incremento_minimo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Incremento minimo
                </label>
                <input
                  type="number"
                  id="incremento_minimo"
                  name="incremento_minimo"
                  value={formData.incremento_minimo}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 tabular-nums"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 active:scale-[0.96]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center active:scale-[0.96]"
              >
                {updateMutation.isPending ? <LoadingSpinner size="sm" /> : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
