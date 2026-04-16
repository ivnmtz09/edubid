import { useState } from "react"
import { XMarkIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { authService } from "../../services/auth"
import toast from "react-hot-toast"
import LoadingSpinner from "../common/LoadingSpinner"

export default function DeleteAccountModal({ user, onClose }) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: advertencia, 2: confirmación

  const handleDelete = async () => {
    if (step === 1) {
      setStep(2)
      return
    }

    // Validaciones
    if (confirmText !== "ELIMINAR") {
      toast.error('Debes escribir "ELIMINAR" para confirmar')
      return
    }

    if (!password) {
      toast.error("Debes ingresar tu contraseña")
      return
    }

    setIsLoading(true)
    try {
      await authService.deleteAccount(password)
      toast.success("Cuenta eliminada. ¡Hasta pronto!")
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } catch (err) {
      toast.error(err.message || "Error al eliminar cuenta")
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl w-full max-w-md shadow-2xl border-2 border-red-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-900">
                Eliminar Cuenta
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {step === 1 ? (
              // Paso 1: Advertencia
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900 font-semibold mb-2">
                    ⚠️ Esta acción es irreversible
                  </p>
                  <p className="text-sm text-amber-800">
                    Al eliminar tu cuenta perderás permanentemente:
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Todos tus datos personales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Tu saldo de Educoins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Tus actividades y calificaciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Tu participación en grupos y subastas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Todo tu historial en la plataforma</span>
                  </li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>¿Necesitas un descanso?</strong> Puedes simplemente cerrar sesión y volver cuando quieras.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                  >
                    Continuar con la eliminación
                  </button>
                </div>
              </div>
            ) : (
              // Paso 2: Confirmación final
              <div className="space-y-4">
                <p className="text-sm text-gray-700 mb-4">
                  Para confirmar la eliminación de tu cuenta, escribe <strong className="text-red-600">ELIMINAR</strong> y tu contraseña:
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escribe "ELIMINAR"
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINAR"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tu contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading || confirmText !== "ELIMINAR" || !password}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar mi cuenta"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}