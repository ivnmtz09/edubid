import { XMarkIcon } from "@heroicons/react/24/outline"
import { useEffect } from "react"

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fondo opaco */}
      <div
        className="fixed inset-0 bg-opacity-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor del modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Contenido del modal */}
        <div
          className={`
            relative bg-white rounded-lg w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col
            border border-orange-400 shadow-[0_0_20px_4px_rgba(255,140,0,0.4)]
            before:content-[''] before:absolute before:inset-0 before:rounded-lg before:-z-10
            before:blur-2xl before:bg-gradient-to-r before:from-orange-500 before:to-amber-400 before:opacity-30
            transition-all duration-300
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
