import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { groupsService } from "../services/groups"
import toast from "react-hot-toast"

export const useGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const data = await groupsService.getGroups()
      console.log("Grupos recibidos:", data) // Debug temporal
      return data
    },
  })
}

export const useCreateGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: groupsService.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries(["groups"])
      toast.success("Grupo creado")
    },
  })
}

export const useUpdateGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => groupsService.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["groups"])
      toast.success("Grupo actualizado")
    },
  })
}

export const useDeleteGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: groupsService.deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries(["groups"])
      toast.success("Grupo eliminado")
    },
  })
}

export const useJoinGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code) => groupsService.joinGroup(code),
    onSuccess: () => {
      queryClient.invalidateQueries(["groups"])
      toast.success("Te uniste al grupo exitosamente")
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Error al unirte al grupo"
      toast.error(message)
    },
  })
}