import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { authService } from "../../services/auth"
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline"
import LoadingSpinner from "../../components/common/LoadingSpinner"

export default function VerifyEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("verifying") // verifying, success, error
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token)
        setStatus("success")
        setMessage(response.message || "¡Email verificado exitosamente!")
        
        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          navigate("/dashboard")
        }, 3000)
      } catch (error) {
        setStatus("error")
        setMessage(error.message || "Error al verificar el email")
      }
    }

    if (token) {
      verify()
    }
  }, [token, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === "verifying" && (
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando email...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras verificamos tu correo electrónico
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Verificación exitosa!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Serás redirigido al dashboard en unos segundos...
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
            >
              Ir al Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <XCircleIcon className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error en la verificación
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
              >
                Volver al inicio
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full border-2 border-orange-500 text-orange-500 py-3 rounded-lg hover:bg-orange-50 transition font-semibold"
              >
                Ir al login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}