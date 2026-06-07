import React from "react";

/**
 * TeacherPatternBg - Patrón decorativo para profesores
 * Usa un patrón de líneas onduladas (flujo, progresión, enseñanza)
 * Basado en Hero Patterns
 */
const TeacherPatternBg = ({ opacity = "opacity-15" }) => {
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
            id="teacher-waves"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            {/* Líneas ondulantes diagonales */}
            <path
              d="M0,10 Q10,5 20,10 T40,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <path
              d="M0,20 Q10,15 20,20 T40,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <path
              d="M0,30 Q10,25 20,30 T40,30"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            {/* Puntos decorativos */}
            <circle cx="10" cy="15" r="0.8" fill="currentColor" />
            <circle cx="30" cy="25" r="0.8" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#teacher-waves)" />
      </svg>
    </div>
  );
};

export default TeacherPatternBg;
