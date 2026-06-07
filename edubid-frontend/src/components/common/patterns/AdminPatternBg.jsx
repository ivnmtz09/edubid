import React from "react";

/**
 * AdminPatternBg - Patrón decorativo para administradores
 * Usa un patrón hexagonal (complejidad, control, red)
 * Basado en Hero Patterns
 */
const AdminPatternBg = ({ opacity = "opacity-15" }) => {
  return (
    <div className={`absolute inset-0 z-0 ${opacity}`}>
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern
            id="admin-hexagon"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            {/* Hexágonos */}
            <path
              d="M10,5 L15,2.5 L20,5 L20,12.5 L15,15 L10,12.5 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <path
              d="M25,15 L30,12.5 L35,15 L35,22.5 L30,25 L25,22.5 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            {/* Líneas conectoras (red) */}
            <line
              x1="20"
              y1="8.75"
              x2="25"
              y2="18.75"
              stroke="currentColor"
              strokeWidth="0.3"
            />
            <line
              x1="15"
              y1="15"
              x2="30"
              y2="12.5"
              stroke="currentColor"
              strokeWidth="0.3"
            />
            {/* Nodos */}
            <circle cx="15" cy="8.75" r="0.8" fill="currentColor" />
            <circle cx="30" cy="18.75" r="0.8" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#admin-hexagon)" />
      </svg>
    </div>
  );
};

export default AdminPatternBg;
