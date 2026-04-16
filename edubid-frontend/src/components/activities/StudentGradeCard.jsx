import { 
  CheckCircleIcon, 
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function StudentGradeCard() {
  // Datos de ejemplo - en la app real vendrían de props
  const submission = {
    calificacion: 4.5,
    valorMaximo: 5.0,
    retroalimentacion: "Excelente trabajo. Demostraste un entendimiento sólido de los conceptos. Sigue así!",
    educoinsGanados: 180,
    fechaCalificacion: "2025-11-10T14:30:00",
    fechaEntrega: "2025-11-08T10:00:00",
    isGraded: true,
    isPending: false
  }

  const calculatePercentage = (score, max) => {
    return ((score / max) * 100).toFixed(0)
  }

  const getGradeColor = (score, max) => {
    const percentage = (score / max) * 100
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getGradeEmoji = (score, max) => {
    const percentage = (score / max) * 100
    if (percentage >= 90) return <SparklesIcon className="h-6 w-6 text-green-600" />
    if (percentage >= 70) return <CheckCircleIcon className="h-6 w-6 text-blue-600" />
    if (percentage >= 50) return <AcademicCapIcon className="h-6 w-6 text-yellow-600" />
    return <ClockIcon className="h-6 w-6 text-red-600" />
  }

  if (!submission.isGraded) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-blue-900 text-base sm:text-lg mb-2">
              Entrega Pendiente de Calificación
            </h4>
            <p className="text-sm sm:text-base text-blue-700 mb-3">
              Tu docente revisará tu entrega pronto. Te notificaremos cuando tengas tu calificación.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
              <CalendarIcon className="h-4 w-4" />
              <span>Entregado el {new Date(submission.fechaEntrega).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gradeColorClass = getGradeColor(submission.calificacion, submission.valorMaximo)
  const percentage = calculatePercentage(submission.calificacion, submission.valorMaximo)

  return (
    <div className="space-y-4">
      {/* Card Principal de Calificación */}
      <div className={`border-2 rounded-xl p-4 sm:p-6 ${gradeColorClass}`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 mt-1">
            {getGradeEmoji(submission.calificacion, submission.valorMaximo)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="font-bold text-lg sm:text-xl mb-1">
                  ¡Actividad Calificada!
                </h4>
                <p className="text-xs sm:text-sm opacity-90">
                  Tu docente ha evaluado tu trabajo
                </p>
              </div>
              
              {/* Badge de porcentaje */}
              <div className="flex-shrink-0 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full">
                <span className="text-xs sm:text-sm font-bold">{percentage}%</span>
              </div>
            </div>

            {/* Calificación Grande */}
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none">
                {submission.calificacion}
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold opacity-70 pb-1 sm:pb-2">
                / {submission.valorMaximo}
              </span>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-white/30 rounded-full h-2 sm:h-3 mb-4 overflow-hidden">
              <div 
                className="bg-current h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                <span>Calificado el {new Date(submission.fechaCalificacion).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short'
                })}</span>
              </div>
              
              {submission.educoinsGanados > 0 && (
                <div className="flex items-center gap-1.5">
                  <CurrencyEuroIcon className="h-4 w-4" />
                  <span className="font-semibold">+{submission.educoinsGanados} EC ganados</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card de Retroalimentación */}
      {submission.retroalimentacion && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-gray-900 text-sm sm:text-base mb-2">
                Retroalimentación del Docente
              </h5>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {submission.retroalimentacion}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje Motivacional */}
      {percentage >= 90 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 text-green-700">
            <SparklesIcon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm sm:text-base font-medium">
              ¡Excelente trabajo! Obtuviste una calificación sobresaliente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}