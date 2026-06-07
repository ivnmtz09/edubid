import React from "react";

const Squares = ({ className, size = 40, color = "#ffffff" }) => {
  return (
    <div className={`absolute inset-0 z-0 ${className}`}>
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <pattern
            id="squares-pattern"
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
          >
            {/* Eliminamos las opacidades internas. stroke y fill son sólidos aquí */}
            <rect
              width={size}
              height={size}
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#squares-pattern)" />
      </svg>
    </div>
  );
};

export default Squares;
