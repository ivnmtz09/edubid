import { useState, useEffect } from "react"
import { useCreateAuction, useUpdateAuction } from "../../hooks/useAuctions"
import { useQuery } from "@tanstack/react-query"
import api from "../../services/api"
import LoadingSpinner from "../common/LoadingSpinner"

const CreateAuction = ({ auction, onClose }) => {
  const createAuction = useCreateAuction()
  const updateAuction = useUpdateAuction()
  const isEditing = !!auction

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    grupo: "",
    fecha_fin: "",
  })
  const [errors, setErrors] = useState({})

  const { data: groups, isLoading: groupsLoading } = useQuery({
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
    if (!formData.titulo.trim()) newErrors.titulo = "El título es requerido"
    if (!formData.descripcion.trim()) newErrors.descripcion = "La descripción es requerida"
    if (!formData.grupo) newErrors.grupo = "Debes seleccionar un grupo"
    if (!formData.fecha_fin) newErrors.fecha_fin = "La fecha de finalización es requerida"

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

      if (isEditing) {
        await updateAuction.mutateAsync({ id: auction.id, data: submitData })
      } else {
        await createAuction.mutateAsync(submitData)
      }
      onClose()
    } catch (error) {
      console.error("Error:", error)
      if (error.response?.data) {
        const backendErrors = error.response.data
        Object.keys(backendErrors).forEach(key => {
          setErrors(prev => ({ 
            ...prev, 
            [key]: Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key] 
          }))
        })
      } else {
        setErrors({ general: "Error de conexión. Intenta nuevamente." })
      }
    }
  }

  const isLoading = createAuction.isPending || updateAuction.isPending

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + 1) // Mínimo 1 hora en el futuro
  const minDateString = minDate.toISOString().slice(0, 16)

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30) // Máximo 30 días en el futuro
  const maxDateString = maxDate.toISOString().slice(0, 16)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
          Título de la Subasta *
        </label>
        <input
          type="text"
          id="titulo"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${
            errors.titulo ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Ej: Puntos extra en el próximo examen"
          maxLength={255}
        />
        {errors.titulo && <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>}
        <p className="mt-1 text-xs text-gray-500">{formData.titulo.length}/255 caracteres</p>
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción de la Recompensa *
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          value={formData.descripcion}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${
            errors.descripcion ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Describe detalladamente la recompensa que obtendrá el ganador..."
        />
        {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="grupo" className="block text-sm font-medium text-gray-700 mb-1">
            Grupo Destinatario *
          </label>
          <select
            id="grupo"
            name="grupo"
            value={formData.grupo}
            onChange={handleChange}
            disabled={groupsLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${
              errors.grupo ? "border-red-500" : "border-gray-300"
            } ${groupsLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">{groupsLoading ? "Cargando grupos..." : "Selecciona un grupo"}</option>
            {groups?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre} - {group.classroom_nombre || group.classroom?.nombre || 'Sin clase'}
              </option>
            ))}
          </select>
          {errors.grupo && <p className="mt-1 text-sm text-red-600">{errors.grupo}</p>}
          {groups?.length === 0 && !groupsLoading && (
            <p className="mt-1 text-sm text-orange-600">
              No tienes grupos disponibles. Primero crea un grupo en una clase.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Finalización *
          </label>
          <input
            type="datetime-local"
            id="fecha_fin"
            name="fecha_fin"
            value={formData.fecha_fin}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${
              errors.fecha_fin ? "border-red-500" : "border-gray-300"
            }`}
            min={minDateString}
            max={maxDateString}
          />
          {errors.fecha_fin && <p className="mt-1 text-sm text-red-600">{errors.fecha_fin}</p>}
          <p className="mt-1 text-xs text-gray-500">
            La subasta debe durar entre 1 hora y 30 días
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <h4 className="font-medium text-blue-900 text-sm sm:text-base mb-2">Información importante</h4>
        <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
          <li>• Los estudiantes pujarán con sus Educoins acumulados</li>
          <li>• Las Educoins se bloquean durante la subasta</li>
          <li>• Solo el ganador pagará las Educoins pujadas</li>
          <li>• Puedes cerrar la subasta manualmente en cualquier momento</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
        <button 
          type="button" 
          onClick={onClose} 
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm sm:text-base"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || groupsLoading || groups?.length === 0}
          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : isEditing ? "Actualizar Subasta" : "Crear Subasta"}
        </button>
      </div>
    </form>
  )
}

export default CreateAuction