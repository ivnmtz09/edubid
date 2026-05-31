import { useTheme } from "../../context/useTheme"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="relative flex items-center w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-all duration-300
        bg-amber-300 dark:bg-[#3A3028]
        hover:shadow-md hover:shadow-amber-300/30 dark:hover:shadow-amber-500/10
        active:scale-95"
    >
      <span
        className={`absolute left-0.5 sm:left-1 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-md transition-all duration-300 ${
          isDark ? "translate-x-7 sm:translate-x-8" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#EA580C]"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#EA580C]"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </span>
    </button>
  )
}
