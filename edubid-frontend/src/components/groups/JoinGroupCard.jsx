import { useState } from "react"
import { useJoinGroup } from "../../hooks/useGroups"
import { UserGroupIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import LoadingSpinner from "../common/LoadingSpinner"

export default function JoinGroupCard() {
  const [code, setCode] = useState("")
  const joinMutation = useJoinGroup()

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!code.trim()) return

    try {
      await joinMutation.mutateAsync(code.trim().toUpperCase())
      setCode("")
    } catch (error) {
      console.error("Error uniéndose al grupo:", error)
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 lg:p-8 text-white shadow-lg border-2 border-blue-400">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="p-2 sm:p-3 bg-white/20 rounded-lg flex-shrink-0">
          <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Unirse a un Grupo</h2>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Ingresa el código de 6 caracteres que te compartió tu profesor para unirte a su grupo de clase
          </p>
        </div>
      </div>

      <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ejemplo: ABC123"
            maxLength={6}
            className="w-full px-3 sm:px-5 py-3 sm:py-3.5 rounded-lg text-blue-100 placeholder-blue-300 font-mono text-base sm:text-lg tracking-wider border-2 border-white/30 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim() || joinMutation.isPending || code.length !== 6}
          className="bg-white text-blue-600 px-4 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
        >
          {joinMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              Unirse
              <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </>
          )}
        </button>
      </form>

      {/* Hint adicional */}
      <div className="mt-3 sm:mt-4 flex items-start space-x-2 bg-white/10 rounded-lg p-3">
        <svg
          className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-xs sm:text-sm text-blue-100">
          El código debe tener exactamente 6 caracteres (letras y números). No distingue mayúsculas.
        </p>
      </div>
    </div>
  )
}