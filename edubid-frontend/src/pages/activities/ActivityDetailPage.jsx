"use client"

import { motion } from "framer-motion"
import ActivityDetail from "../../components/activities/ActivityDetail"
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline"

export default function ActivityDetailPage() {
  return (
    <motion.div
      className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg sm:rounded-xl">
          <ClipboardDocumentCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Detalle de Actividad</h1>
      </div>

      {/* Detalle */}
      <ActivityDetail />
    </motion.div>
  )
}