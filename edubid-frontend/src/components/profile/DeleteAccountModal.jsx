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
  const [step, setStep] = useState(1)

  const handleDelete = async () => {
    if (step === 1) {
      setStep(2)
      return
    }

    if (confirmText !== "ELIMINAR") {
      toast.error('Debes escribir "ELIMINAR" para confirmar')
      return
    }

    if (!password) {
      toast.error("Debes ingresar tu contrasena")
      return
    }

    setIsLoading(true)
    try {
      await authService.deleteAccount(password)
      toast.success("Cuenta eliminada. Hasta pronto!")
      
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
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-lg border border-gray-200 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-red-50 dark:bg-red-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-red-900 dark:text-red-300">
                Eliminar Cuenta
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all p-1 rounded-lg hover:bg-white dark:hover:bg-gray-800 active:scale-[0.96]"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-900/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
                    Esta accion es irreversible
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-400">
                    Al eliminar tu cuenta perderas permanentemente:
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">-</span>
                    <span>Todos tus datos personales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">-</span>
                    <span>Tu saldo de edubids</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">-</span>
                    <span>Tus actividades y calificaciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">-</span>
                    <span>Tu participacion en grupos y subastas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">-</span>
                    <span>Todo tu historial en la plataforma</span>
                  </li>
                </ul>

                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-900/20 rounded-lg p-4">
                  <p className="text-sm text-orange-800 dark:text-orange-400">
                    <strong>Necesitas un descanso?</strong> Puedes simplemente cerrar sesion y volver cuando quieras.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all font-medium active:scale-[0.96]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium active:scale-[0.96]"
                  >
                    Continuar con la eliminacion
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Para confirmar la eliminacion de tu cuenta, escribe <strong className="text-red-600 dark:text-red-400">ELIMINAR</strong> y tu contrasena:
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Escribe "ELIMINAR"
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINAR"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tu contrasena
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="*******"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg pr-10 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all font-medium active:scale-[0.96]"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading || confirmText !== "ELIMINAR" || !password}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.96]"
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
