import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth";
import toast from "react-hot-toast";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: authService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
      toast.success("Perfil actualizado correctamente");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar el perfil");
    },
  });
};
