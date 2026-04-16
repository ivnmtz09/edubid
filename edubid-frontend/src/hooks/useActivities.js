import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { activityService, submissionService } from "../services/activities"
import toast from "react-hot-toast"

// ========== ACTIVITIES ==========

export const useActivities = (params = {}) => {
  return useQuery({
    queryKey: ["activities", params],
    queryFn: () => activityService.getActivities(params),
    staleTime: 5 * 60 * 1000,
  })
}

export const useActivity = (id) => {
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () => activityService.getActivity(id),
    enabled: !!id,
  })
}

export const useCreateActivity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: activityService.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      toast.success("Actividad creada exitosamente")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Error al crear actividad")
    },
  })
}

export const useUpdateActivity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => activityService.updateActivity(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["activity", variables.id] })
      toast.success("Actividad actualizada exitosamente")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Error al actualizar actividad")
    },
  })
}

export const useDeleteActivity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: activityService.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      toast.success("Actividad eliminada exitosamente")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Error al eliminar actividad")
    },
  })
}

// ========== SUBMISSIONS ==========

export const useSubmissions = (params = {}) => {
  return useQuery({
    queryKey: ["submissions", params],
    queryFn: () => submissionService.getSubmissions(params),
    staleTime: 2 * 60 * 1000,
  })
}

export const useSubmission = (id) => {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionService.getSubmission(id),
    enabled: !!id,
  })
}

export const useCreateSubmission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submissionService.createSubmission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["activity", data.activity] })
      
      toast.success("Entrega enviada exitosamente")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Error al enviar entrega")
    },
  })
}

// NUEVO: Hook para cancelar submission
export const useCancelSubmission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submissionService.cancelSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      toast.success("Entrega cancelada exitosamente")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Error al cancelar entrega")
    },
  })
}

export const useGradeSubmission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => submissionService.gradeSubmission(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      toast.success(
        `Calificación guardada. ${response.coins_ganados > 0 ? `+${response.coins_ganados} Educoins` : ""}`
      )
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Error al calificar")
    },
  })
}

export const useActivitySubmissions = (activityId) => {
  return useQuery({
    queryKey: ["activity-submissions", activityId],
    queryFn: () => activityService.getActivitySubmissions(activityId),
    enabled: !!activityId,
  })
}