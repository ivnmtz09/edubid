import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { LockClosedIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { authService } from "../../services/auth"
import toast from "react-hot-toast"
import LoadingSpinner from "../../components/common/LoadingSpinner"

export default function ForgotPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || "")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Por favor ingresa tu email")
      return
    }

    setIsLoading(true)
    try {
      await authService.requestPasswordReset(email)
      setEmailSent(true)
      toast.success("¡Email enviado! Revisa tu bandeja de entrada")
    } catch (error) {
      toast.error(error.message || "Error al enviar email")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
            <LockClosedIcon className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            ¡Email enviado!
          </h1>

          <p className="text-gray-600 mb-4">
            Hemos enviado las instrucciones para restablecer tu contraseña a:
          </p>
          <p className="text-blue-600 font-semibold text-lg mb-6 break-all">
            {email}
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left text-sm text-blue-800">
            <p className="font-semibold mb-2">Pasos a seguir:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Revisa tu bandeja de entrada</li>
              <li>Haz clic en el enlace del correo</li>
              <li>Crea tu nueva contraseña</li>
            </ol>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            El enlace expirará en 1 hora por seguridad
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-semibold"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6 text-sm font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>

        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
          <LockClosedIcon className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-gray-600 text-center mb-6">
          No te preocupes, te enviaremos instrucciones para restablecerla
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Enviando...
              </>
            ) : (
              "Enviar instrucciones"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Recordaste tu contraseña?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 font-medium hover:text-blue-700 underline"
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  )
}