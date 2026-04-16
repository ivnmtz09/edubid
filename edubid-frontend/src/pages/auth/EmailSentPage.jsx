import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { authService } from "../../services/auth"
import toast from "react-hot-toast"
import LoadingSpinner from "../../components/common/LoadingSpinner"

export default function EmailSentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Obtener email del state
  const email = location.state?.email || ""

  if (!email) {
    navigate("/")
    return null
  }

  const handleResendEmail = async () => {
    if (countdown > 0) return

    setIsResending(true)
    try {
      await authService.resendVerificationEmail(email)
      toast.success("¡Email reenviado! Revisa tu bandeja de entrada")
      
      // Countdown de 60 segundos
      setCountdown(60)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      toast.error(error.message || "Error al reenviar email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-orange-200 p-8 text-center">
        {/* Icon animado */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <EnvelopeIcon className="h-10 w-10 text-white" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ¡Revisa tu email!
        </h1>

        {/* Email del usuario */}
        <p className="text-gray-600 mb-2">
          Hemos enviado un correo de verificación a:
        </p>
        <p className="text-orange-600 font-semibold text-lg mb-6 break-all">
          {email}
        </p>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            Pasos a seguir:
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Abre tu bandeja de entrada</li>
            <li>Busca el email de Educoin</li>
            <li>Haz clic en el botón de verificación</li>
            <li>¡Listo! Podrás acceder a tu cuenta</li>
          </ol>
        </div>

        {/* Botón reenviar */}
        <button
          onClick={handleResendEmail}
          disabled={isResending || countdown > 0}
          className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold mb-4 flex items-center justify-center gap-2"
        >
          {isResending ? (
            <>
              <LoadingSpinner size="sm" />
              Reenviando...
            </>
          ) : countdown > 0 ? (
            `Reenviar en ${countdown}s`
          ) : (
            "Reenviar email de verificación"
          )}
        </button>

        {/* Nota */}
        <p className="text-xs text-gray-500">
          ¿No recibes el email? Revisa tu carpeta de spam o correo no deseado
        </p>

        {/* Volver al inicio */}
        <button
          onClick={() => navigate("/")}
          className="mt-6 text-sm text-gray-600 hover:text-orange-600 transition underline"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
