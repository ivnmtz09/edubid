import React from "react";

/**
 * StudentPatternBg - Patrón decorativo para estudiantes
 * Usa un patrón de grilla (orden, estructura académica)
 * Basado en Hero Patterns
 */
const StudentPatternBg = ({ opacity = "opacity-15" }) => {
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
            id="student-grid"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            {/* Líneas de grilla */}
            <rect
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            {/* Puntos en las intersecciones */}
            <circle cx="0" cy="0" r="1" fill="currentColor" />
            <circle cx="20" cy="0" r="1" fill="currentColor" />
            <circle cx="0" cy="20" r="1" fill="currentColor" />
            <circle cx="20" cy="20" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#student-grid)" />
      </svg>
    </div>
  );
};

export default StudentPatternBg;
