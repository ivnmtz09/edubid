import { useState, useEffect } from "react"
import { useGradeSubmission } from "../../hooks/useActivities"
import { UserCircleIcon, DocumentTextIcon } from "@heroicons/react/24/outline"
import { formatDate } from "../../utils/helpers"
import { useAuthContext } from "../../context/AuthContext"

export default function SubmissionsList({ submissions, activityId }) {
  const gradeMutation = useGradeSubmission()
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [gradeData, setGradeData] = useState({
    nota: "",
    retroalimentacion: ""
  })

  // Debug temporal - eliminar después
  useEffect(() => {
    console.log("Submissions recibidas:", submissions)
    if (submissions && submissions.length > 0) {
      console.log("Primera submission completa:", JSON.stringify(submissions[0], null, 2))
    }
  }, [submissions])

  const handleGrade = async (submissionId) => {
    try {
      await gradeMutation.mutateAsync({
        id: submissionId,
        data: {
          nota: parseFloat(gradeData.nota),
          retroalimentacion: gradeData.retroalimentacion
        }
      })
      setSelectedSubmission(null)
      setGradeData({ nota: "", retroalimentacion: "" })
    } catch (error) {
      console.error("Error calificando:", error)
    }
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm sm:text-base">No hay entregas aún</p>
      </div>
    )
  }

  // Función auxiliar para obtener el nombre del estudiante
  const getStudentName = (submission) => {
    if (submission.estudiante && typeof submission.estudiante === 'object') {
      const firstName = submission.estudiante.first_name || ''
      const lastName = submission.estudiante.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      if (fullName) return fullName
    }
    
    if (submission.user && typeof submission.user === 'object') {
      const firstName = submission.user.first_name || ''
      const lastName = submission.user.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      if (fullName) return fullName
    }
    
    if (submission.estudiante_email) {
      return submission.estudiante_email
    }
    
    if (submission.user) {
      return `Usuario ${submission.user}`
    }
    
    return "Estudiante Desconocido"
  }

  const getStudentEmail = (submission) => {
    if (submission.estudiante_email) {
      return submission.estudiante_email
    }
    
    if (submission.estudiante && typeof submission.estudiante === 'object' && submission.estudiante.email) {
      return submission.estudiante.email
    }
    
    if (submission.user && typeof submission.user === 'object' && submission.user.email) {
      return submission.user.email
    }
    
    return null
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const studentName = getStudentName(submission)
        const studentEmail = getStudentEmail(submission)

        return (
          <div
            key={submission.id}
            className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                <div className="bg-purple-50 p-1.5 md:p-2 rounded-full flex-shrink-0">
                  <UserCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                    {studentName}
                  </h4>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    {studentEmail && (
                      <span className="block sm:inline">
                        {studentEmail}
                        <span className="hidden sm:inline"> - </span>
                      </span>
                    )}
                    <span className="block sm:inline">
                      Entregado el <span className="font-medium text-gray-700">{formatDate(submission.creado)}</span>
                    </span>
                  </p>
                  
                  {submission.contenido && (
                    <p className="text-sm text-gray-700 mt-2 md:mt-3 bg-purple-50 border border-purple-100 p-2 md:p-3 rounded-lg break-words">
                      {submission.contenido}
                    </p>
                  )}

                  {submission.archivo && (
                    <a
                      href={submission.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 md:space-x-2 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors duration-200 mt-2 md:mt-3 w-fit"
                    >
                      <DocumentTextIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                      <span className="truncate">Ver archivo adjunto</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 lg:gap-2 lg:ml-4 lg:text-right">
                {submission.calificacion !== null && submission.calificacion !== undefined ? (
                  <div className="space-y-1 md:space-y-2">
                    <div className="text-xl md:text-2xl font-bold text-green-600 bg-green-50 px-2 md:px-3 py-1 md:py-2 rounded-lg w-fit lg:w-auto">
                      {submission.calificacion}/5.0
                    </div>
                    {submission.retroalimentacion && (
                      <p className="text-xs md:text-sm text-gray-600 max-w-xs bg-gray-50 p-2 rounded border border-gray-100 break-words">
                        {submission.retroalimentacion}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission.id)
                      setGradeData({
                        nota: submission.calificacion || "",
                        retroalimentacion: submission.retroalimentacion || ""
                      })
                    }}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium text-sm md:text-base shadow-sm w-full sm:w-auto lg:w-full text-center"
                  >
                    Calificar
                  </button>
                )}
              </div>
            </div>

            {selectedSubmission === submission.id && (
              <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-gray-200 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                      Nota:
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      required
                      value={gradeData.nota}
                      onChange={(e) => setGradeData({...gradeData, nota: e.target.value})}
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm md:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                    Retroalimentación
                  </label>
                  <textarea
                    value={gradeData.retroalimentacion}
                    onChange={(e) => setGradeData({...gradeData, retroalimentacion: e.target.value})}
                    rows={3}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm md:text-base"
                    placeholder="Comentarios para el estudiante..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 md:px-5 py-2 md:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-sm md:text-base order-2 sm:order-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleGrade(submission.id)}
                    disabled={!gradeData.nota || gradeMutation.isPending}
                    className="px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base order-1 sm:order-2"
                  >
                    {gradeMutation.isPending ? (
                      <>
                        <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      "Guardar Calificación"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}