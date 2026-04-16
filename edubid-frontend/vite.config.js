import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "https://educoin-production.up.railway.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
