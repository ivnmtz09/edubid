"use client"

import { useState } from "react"
import { useAuthContext } from "../../context/AuthContext"
import { institutionsService } from "../../services/institutions"
import toast from "react-hot-toast"

export default function RectorDashboard() {
  const { user, setUser } = useAuthContext()
  const institution = user?.institution

  const [colorPrimario, setColorPrimario] = useState(institution?.color_primario || "#f97316")
  const [colorSecundario, setColorSecundario] = useState(institution?.color_secundario || "#3b82f6")
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(institution?.logo || null)
  const [saving, setSaving] = useState(false)

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!institution?.id) {
      toast.error("No se encontró la institución asociada a tu cuenta")
      return
    }

    setSaving(true)

    let payload
    if (logoFile) {
      const fd = new FormData()
      fd.append("color_primario", colorPrimario)
      fd.append("color_secundario", colorSecundario)
      fd.append("logo", logoFile)
      payload = fd
    } else {
      payload = {
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
      }
    }

    try {
      const updated = await institutionsService.updateInstitution(institution.id, payload)
      const mergedUser = {
        ...user,
        institution: updated,
        profile: { ...user.profile, institucion: updated },
      }
      setUser(mergedUser)
      localStorage.setItem("user", JSON.stringify(mergedUser))
      toast.success("Imagen institucional actualizada. Los cambios se ven reflejados al instante.")
    } catch (err) {
      const msg = err.response?.data?.detail
        || Object.values(err.response?.data || {}).flat().join(", ")
        || "Error al guardar la configuración"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bienvenido, {user?.first_name || "Rector"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {institution?.nombre
            ? `Panel de administración de ${institution.nombre}`
            : "Panel de administración institucional"}
        </p>
      </div>

      {/* White-Label Settings */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Configuración de Marca (White-Label)
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo de la Institución
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-16 w-16 object-contain rounded-lg border border-gray-200 dark:border-white/10"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>
          </div>

          {/* Color Primario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Primario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                className="h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {colorPrimario}
              </span>
              <div
                className="h-6 w-16 rounded border border-gray-200 dark:border-white/10"
                style={{ backgroundColor: colorPrimario }}
              />
            </div>
          </div>

          {/* Color Secundario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorSecundario}
                onChange={(e) => setColorSecundario(e.target.value)}
                className="h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {colorSecundario}
              </span>
              <div
                className="h-6 w-16 rounded border border-gray-200 dark:border-white/10"
                style={{ backgroundColor: colorSecundario }}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.96]"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
