"use client"

import { useState } from "react"
import { useAuthContext } from "../../context/AuthContext"
import Modal from "../common/Modal"
import GradeSubmission from "./GradeSubmission"
import {
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarIcon,
  StarIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline"
import { formatDate, formatRelativeTime } from "../../utils/helpers"

export default function SubmissionList({ submissions, activityId }) {
  const { user } = useAuthContext()
  const isTeacher = user?.role === "docente"
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [expandedSubmission, setExpandedSubmission] = useState(null)

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No hay entregas aún
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          {isTeacher 
            ? "Los estudiantes aparecerán aquí cuando entreguen esta actividad"
            : "Aún no hay entregas de otros estudiantes"
          }
        </p>
      </div>
    )
  }

  const toggleExpand = (submissionId) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId)
  }

  return (
    <div className="space-y-4">
      {/* Header de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
          <div className="text-xs text-gray-600 mt-1">Total Entregas</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {submissions.filter(s => s.calificacion !== null).length}
          </div>
          <div className="text-xs text-gray-600 mt-1">Calificadas</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {submissions.filter(s => s.calificacion === null).length}
          </div>
          <div className="text-xs text-gray-600 mt-1">Pendientes</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {submissions.reduce((sum, s) => sum + (s.educoins || 0), 0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Educoins Otorgadas</div>
        </div>
      </div>

      {/* Lista de entregas */}
      <div className="space-y-3">
        {submissions.map((submission) => {
          const isExpanded = expandedSubmission === submission.id
          const isGraded = submission.calificacion !== null

          return (
            <div
              key={submission.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Header de la entrega */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(submission.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      isGraded ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {isGraded ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {submission.estudiante_nombre || 
                         `${submission.estudiante?.first_name} ${submission.estudiante?.last_name}`}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{formatRelativeTime(submission.creado) || formatDate(submission.creado)}</span>
                        </div>
                        {isGraded && (
                          <>
                            <div className="flex items-center space-x-1">
                              <StarIcon className="h-3 w-3 text-yellow-500" />
                              <span className="font-medium text-green-600">
                                {submission.calificacion} pts
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CurrencyEuroIcon className="h-3 w-3 text-orange-500" />
                              <span className="font-medium text-orange-600">
                                {submission.educoins || 0} EC
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!isGraded && isTeacher && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSubmission(submission)
                        }}
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        Calificar
                      </button>
                    )}
                    <div className={`transform transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido expandible */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Contenido de la entrega */}
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                        Contenido de la Entrega
                      </h5>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {submission.contenido || "El estudiante no incluyó una descripción."}
                        </p>
                      </div>
                      
                      {/* Archivos adjuntos */}
                      {submission.archivo && (
                        <div className="mt-4">
                          <h6 className="font-medium text-gray-900 text-sm mb-2">Archivo Adjunto</h6>
                          <a
                            href={submission.archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Ver archivo adjunto
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Información de calificación */}
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <AcademicCapIcon className="h-4 w-4 text-green-600" />
                        {isGraded ? 'Calificación' : 'Estado'}
                      </h5>
                      
                      {isGraded ? (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-700">Calificación:</span>
                              <span className="text-2xl font-bold text-green-700">
                                {submission.calificacion}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-orange-700">Educoins:</span>
                              <span className="text-xl font-bold text-orange-700">
                                {submission.educoins} EC
                              </span>
                            </div>
                          </div>
                          
                          {submission.retroalimentacion && (
                            <div>
                              <h6 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                                <ChatBubbleLeftIcon className="h-4 w-4 text-purple-600" />
                                Retroalimentación
                              </h6>
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-sm text-purple-700">
                                  {submission.retroalimentacion}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <ClockIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-yellow-700">
                            Pendiente de calificación
                          </p>
                          {isTeacher && (
                            <button
                              onClick={() => setSelectedSubmission(submission)}
                              className="mt-3 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium"
                            >
                              Calificar Ahora
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal para calificar */}
      <Modal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title="Calificar Entrega"
        size="lg"
      >
        {selectedSubmission && (
          <GradeSubmission
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}
      </Modal>
    </div>
  )
}