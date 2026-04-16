import { toast as hotToast } from "react-hot-toast"

export const useToast = () => {
  return {
    toast: ({ title, description, variant }) => {
      if (variant === "destructive") {
        hotToast.error(`${title} - ${description}`)
      } else {
        hotToast.success(`${title} - ${description}`)
      }
    },
  }
}
