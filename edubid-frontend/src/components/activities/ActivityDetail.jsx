import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import { 
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  PencilIcon,
  DocumentTextIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
import { useActivity, useActivitySubmissions, useCancelSubmission } from "../../hooks/useActivities"
import { useAuthContext } from "../../context/AuthContext"
import LoadingSpinner from "../common/LoadingSpinner"
import SubmitActivityForm from "./SubmitActivityForm"
import SubmissionsList from "./SubmissionsList"
import EditActivityModal from "./EditActivityModal"
import { formatDate } from "../../utils/helpers"

export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { data: activity, isLoading } = useActivity(id)
  const { data: submissions } = useActivitySubmissions(id)
  const cancelMutation = useCancelSubmission()
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const isTeacher = user?.role === "docente"
  
  // CORREGIDO: Usar activity.user_submission que viene del serializer con toda la data
  const userSubmission = !isTeacher && activity?.user_submission ? activity.user_submission : null
  
  const isGraded = userSubmission?.calificacion !== null && userSubmission?.calificacion !== undefined
  const canCancelSubmission = userSubmission && !isGraded && !activity?.esta_vencida

  const handleCancelSubmission = async () => {
    if (!userSubmission) return
    
    try {
      await cancelMutation.mutateAsync(userSubmission.id)
      setShowCancelConfirm(false)
    } catch (error) {
      console.error("Error cancelando entrega:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-red-600 text-base sm:text-lg mb-4">Actividad no encontrada</p>
        <button 
          onClick={() => navigate("/activities")} 
          className="bg-purple-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-purple-600 transition font-medium text-sm sm:text-base"
        >
          Volver a Actividades
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <button
          onClick={() => navigate("/activities")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 w-fit touch-manipulation"
        >
          <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Volver</span>
        </button>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {isTeacher && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center gap-2 bg-purple-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-purple-600 transition text-sm sm:text-base touch-manipulation order-2 sm:order-1"
            >
              <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Editar Actividad</span>
              <span className="sm:hidden">Editar</span>
            </button>
          )}
          
          {!isTeacher && !userSubmission && activity.habilitada && !activity.esta_vencida && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="flex items-center justify-center gap-2 bg-purple-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-purple-600 transition text-sm sm:text-base touch-manipulation order-1 sm:order-2"
            >
              <DocumentArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Entregar Actividad</span>
            </button>
          )}

          {!isTeacher && canCancelSubmission && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center justify-center gap-2 bg-red-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-red-600 transition text-sm sm:text-base touch-manipulation order-3"
            >
              <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Cancelar Entrega</span>
            </button>
          )}
        </div>
      </div>

      {/* Activity Card */}
      <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        {/* Header - Purple Theme */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 sm:p-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium uppercase bg-white/20 px-2 py-1 rounded inline-block">
                {activity.tipo}
              </span>
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mt-2 break-words">
                {activity.nombre}
              </h1>
            </div>
            {userSubmission && (
              <CheckCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-300 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Descripción */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg mb-2">
              Descripción
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base break-words">
              {activity.descripcion || "Sin descripción"}
            </p>
          </div>

          {/* Archivo Adjunto del Docente */}
          {activity.archivo_adjunto && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-purple-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Material Adjunto</span>
              </h3>
              <a
                href={activity.archivo_adjunto}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:underline text-sm sm:text-base break-all touch-manipulation"
              >
                <DocumentArrowUpIcon className="h-4 w-4 flex-shrink-0" />
                <span>Ver archivo adjunto del docente</span>
              </a>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 text-gray-500 mb-1 sm:mb-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Fecha de Entrega</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                {formatDate(activity.fecha_entrega)}
              </p>
              {activity.esta_vencida && (
                <span className="text-xs text-red-600 mt-1 block">Vencida</span>
              )}
            </div>

            <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 text-orange-600 mb-1 sm:mb-2">
                <CurrencyEuroIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Valor en Educoins</span>
              </div>
              <p className="font-semibold text-orange-600 text-base sm:text-lg lg:text-xl">
                {activity.valor_educoins} EC
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
              <div className="text-xs sm:text-sm text-blue-600 mb-1 sm:mb-2">Valor en Notas</div>
              <p className="font-semibold text-blue-600 text-base sm:text-lg lg:text-xl">
                {activity.valor_notas}
              </p>
            </div>
          </div>

          {/* Student Submission Status */}
          {!isTeacher && userSubmission && (
            <>
              {isGraded ? (
                // Vista de Calificación Mejorada
                <div className="space-y-4">
                  {/* Card Principal de Calificación */}
                  <div className={`border-2 rounded-xl p-4 sm:p-6 ${
                    (() => {
                      const percentage = (userSubmission.calificacion / activity.valor_notas) * 100
                      if (percentage >= 90) return 'bg-green-50 border-green-300 text-green-700'
                      if (percentage >= 70) return 'bg-blue-50 border-blue-300 text-blue-700'
                      if (percentage >= 50) return 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      return 'bg-red-50 border-red-300 text-red-700'
                    })()
                  }`}>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8" />
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
                          
                          <div className="flex-shrink-0 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full">
                            <span className="text-xs sm:text-sm font-bold">
                              {((userSubmission.calificacion / activity.valor_notas) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Calificación Grande */}
                        <div className="flex items-end gap-2 mb-4">
                          <span className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-none">
                            {userSubmission.calificacion}
                          </span>
                          <span className="text-xl sm:text-2xl lg:text-3xl font-semibold opacity-70 pb-1">
                            / {activity.valor_notas}
                          </span>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="w-full bg-white/30 rounded-full h-2 sm:h-3 mb-4 overflow-hidden">
                          <div 
                            className="bg-current h-full rounded-full transition-all duration-500"
                            style={{ width: `${(userSubmission.calificacion / activity.valor_notas) * 100}%` }}
                          />
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Calificado el {formatDate(userSubmission.actualizado || userSubmission.creado)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <CurrencyEuroIcon className="h-4 w-4" />
                            <span className="font-semibold">
                              +{Math.floor((userSubmission.calificacion / activity.valor_notas) * activity.valor_educoins)} EC ganados
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card de Retroalimentación */}
                  {userSubmission.retroalimentacion && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base mb-2">
                            Retroalimentación del Docente
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                              {userSubmission.retroalimentacion}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje Motivacional */}
                  {((userSubmission.calificacion / activity.valor_notas) * 100) >= 90 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm sm:text-base font-medium">
                          ¡Excelente trabajo! Obtuviste una calificación sobresaliente.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Vista de Entrega Pendiente
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-blue-900 text-base sm:text-lg mb-2">
                        Entrega Pendiente de Calificación
                      </h4>
                      <p className="text-sm sm:text-base text-blue-700 mb-3">
                        Tu docente revisará tu entrega pronto. Te notificaremos cuando tengas tu calificación.
                      </p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Entregado el {formatDate(userSubmission.creado)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Warning si está vencida */}
          {!isTeacher && !userSubmission && activity.esta_vencida && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-xs sm:text-sm">
                  Esta actividad ha vencido. Ya no es posible realizar entregas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submissions List (Teacher View) */}
      {isTeacher && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 lg:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
            Entregas de Estudiantes ({submissions?.length || 0})
          </h2>
          <SubmissionsList submissions={submissions} activityId={id} />
        </div>
      )}

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <SubmitActivityForm
          activityId={id}
          onClose={() => setShowSubmitForm(false)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditActivityModal
          activity={activity}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl w-full max-w-md shadow-xl border border-gray-200 p-4 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Cancelar entrega?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Esta acción eliminará tu entrega de esta actividad. Podrás volver a entregarla antes de la fecha límite.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base touch-manipulation"
                  >
                    No, mantener
                  </button>
                  <button
                    onClick={handleCancelSubmission}
                    disabled={cancelMutation.isPending}
                    className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Cancelando...</span>
                      </>
                    ) : (
                      'Sí, cancelar entrega'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}