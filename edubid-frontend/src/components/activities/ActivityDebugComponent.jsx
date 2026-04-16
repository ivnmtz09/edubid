import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function ActivityDebugComponent() {
  // Simular datos como vendrían del backend
  const activityWithGrade = {
    id: 1,
    nombre: "Tarea de Matemáticas",
    valor_notas: 5.0,
    valor_educoins: 100,
    user_submission: {
      id: 10,
      calificacion: 4.5,  // ← ESTE ES EL DATO CLAVE
      retroalimentacion: "Excelente trabajo. Demostraste dominio del tema.",
      creado: "2025-11-08T10:00:00",
      actualizado: "2025-11-09T15:30:00",
      contenido: "Mi respuesta a la tarea",
      archivo: null,
      estudiante: 5,
      activity: 1
    }
  }

  const activityPending = {
    id: 2,
    nombre: "Proyecto de Ciencias",
    valor_notas: 5.0,
    valor_educoins: 150,
    user_submission: {
      id: 11,
      calificacion: null,  // ← Sin calificar
      retroalimentacion: null,
      creado: "2025-11-09T10:00:00",
      actualizado: "2025-11-09T10:00:00",
      contenido: "Mi proyecto",
      archivo: "url-del-archivo",
      estudiante: 5,
      activity: 2
    }
  }

  const activityNotSubmitted = {
    id: 3,
    nombre: "Quiz de Historia",
    valor_notas: 5.0,
    valor_educoins: 50,
    user_submission: null  // ← No ha entregado
  }

  const renderActivityCard = (activity, title) => {
    const userSubmission = activity.user_submission
    const isGraded = userSubmission?.calificacion !== null && userSubmission?.calificacion !== undefined
    const percentage = isGraded ? (userSubmission.calificacion / activity.valor_notas) * 100 : 0

    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          {isGraded ? (
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          ) : userSubmission ? (
            <CheckCircleIcon className="h-6 w-6 text-blue-600" />
          ) : (
            <XCircleIcon className="h-6 w-6 text-gray-400" />
          )}
          {title}
        </h3>

        {/* Estado */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">user_submission:</span>
              <span className={`ml-2 ${userSubmission ? 'text-green-600' : 'text-red-600'}`}>
                {userSubmission ? '✓ Existe' : '✗ null'}
              </span>
            </div>
            <div>
              <span className="font-semibold">calificacion:</span>
              <span className={`ml-2 ${isGraded ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                {userSubmission?.calificacion !== null ? userSubmission.calificacion : 'null'}
              </span>
            </div>
          </div>
        </div>

        {/* Visualización según estado */}
        {!userSubmission && (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-gray-600">No hay entrega aún</p>
          </div>
        )}

        {userSubmission && !isGraded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  Pendiente de Calificación
                </h4>
                <p className="text-sm text-blue-700">
                  Tu docente revisará tu entrega pronto.
                </p>
              </div>
            </div>
          </div>
        )}

        {userSubmission && isGraded && (
          <div className={`border-2 rounded-lg p-4 ${
            percentage >= 90 ? 'bg-green-50 border-green-300 text-green-700' :
            percentage >= 70 ? 'bg-blue-50 border-blue-300 text-blue-700' :
            percentage >= 50 ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
            'bg-red-50 border-red-300 text-red-700'
          }`}>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-8 w-8 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">¡Calificada!</h4>
                  <div className="px-3 py-1 bg-white/50 rounded-full">
                    <span className="text-sm font-bold">{percentage.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Calificación grande */}
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-5xl font-bold leading-none">
                    {userSubmission.calificacion}
                  </span>
                  <span className="text-2xl font-semibold opacity-70 pb-1">
                    / {activity.valor_notas}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-white/30 rounded-full h-3 mb-3 overflow-hidden">
                  <div 
                    className="bg-current h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {userSubmission.retroalimentacion && (
                  <div className="mt-3 pt-3 border-t border-current/20">
                    <p className="text-sm font-medium mb-1">Retroalimentación:</p>
                    <p className="text-sm opacity-90">{userSubmission.retroalimentacion}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* JSON Raw Data */}
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Ver datos raw (JSON)
          </summary>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
            {JSON.stringify({ user_submission: userSubmission }, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-purple-600 text-white rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-2">
            🔍 Debug: Visualización de Calificaciones
          </h1>
          <p className="text-purple-100">
            Comparación de los 3 estados posibles de una actividad
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderActivityCard(activityWithGrade, "1. Actividad Calificada")}
          {renderActivityCard(activityPending, "2. Pendiente de Calificación")}
          {renderActivityCard(activityNotSubmitted, "3. No Entregada")}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">📋 Checklist de Implementación</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span>Serializer retorna <code className="bg-gray-100 px-1 rounded">user_submission</code> con calificación</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span>Frontend usa <code className="bg-gray-100 px-1 rounded">activity.user_submission</code></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span>Validación: <code className="bg-gray-100 px-1 rounded">calificacion !== null</code></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span>UI con colores según rendimiento (verde/azul/amarillo/rojo)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span>Retroalimentación visible en card separado</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 Punto Clave</h3>
          <p className="text-sm text-blue-800">
            El estudiante debe ver su calificación <strong>inmediatamente</strong> después de que el docente 
            la asigna. No debe recargar la página. El campo <code className="bg-white px-1 rounded">user_submission.calificacion</code> 
            se actualiza automáticamente cuando el serializer responde con los datos actualizados.
          </p>
        </div>
      </div>
    </div>
  )
}