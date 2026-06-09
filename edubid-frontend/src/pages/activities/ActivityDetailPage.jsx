"use client";

import { motion } from "framer-motion";
import ActivityDetail from "../../components/activities/ActivityDetail";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default function ActivityDetailPage() {
  return (
    // Regla 18: contenedor raíz con bg explícito en ambos modos
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          {/* Regla 17: purple — no bg-purple-100 sin dark variant */}
          <div className="p-1.5 sm:p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-xl">
            <ClipboardDocumentCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
          </div>
          {/* Regla 18: texto con par dark */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white [text-wrap:balance]">
            Detalle de Actividad
          </h1>
        </div>

        <ActivityDetail />
      </div>
    </motion.div>
  );
}
