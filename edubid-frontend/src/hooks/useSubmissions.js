import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as submissionService from "../services/submissions"

export function useSubmissions(activityId) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["submissions", activityId],
    queryFn: () => submissionService.getSubmissions(activityId),
    enabled: !!activityId,
  })

  const createSubmission = useMutation({
    mutationFn: submissionService.createSubmission,
    onSuccess: () => queryClient.invalidateQueries(["submissions", activityId]),
  })

  const updateSubmission = useMutation({
    mutationFn: submissionService.updateSubmission,
    onSuccess: () => queryClient.invalidateQueries(["submissions", activityId]),
  })

  return {
    submissions: data || [],
    isLoading,
    createSubmission: createSubmission.mutateAsync,
    updateSubmission: updateSubmission.mutateAsync,
  }
}
