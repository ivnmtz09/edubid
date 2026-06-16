import { createContext, useState, useEffect, useCallback, useMemo } from "react"
import { useAuthContext } from "./AuthContext"

export const ThemeContext = createContext(undefined)

function getInitialTheme() {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("edubid-theme")
    if (stored === "dark" || stored === "light") return stored
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return "light"
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null
}

export function darkenHex(hex, amount = 0.15) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)))
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)))
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)))
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

function lightenHex(hex, amount = 0.15) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount))
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

export function injectBrandColors(institution) {
  const root = document.documentElement
  if (!institution?.color_primario && !institution?.color_secundario) {
    root.style.removeProperty("--brand-primary")
    root.style.removeProperty("--brand-primary-hover")
    root.style.removeProperty("--brand-accent")
    root.style.removeProperty("--brand-accent-hover")
    return
  }
  const primary = institution.color_primario || "#f97316"
  const accent = institution.color_secundario || "#3b82f6"
  root.style.setProperty("--brand-primary", primary)
  root.style.setProperty("--brand-primary-hover", darkenHex(primary))
  root.style.setProperty("--brand-accent", accent)
  root.style.setProperty("--brand-accent-hover", darkenHex(accent))
}

export function ThemeProvider({ children }) {
  const { user } = useAuthContext()
  const [theme, setTheme] = useState(getInitialTheme)

  const institution = user?.institution ?? null

  useEffect(() => {
    injectBrandColors(institution)
  }, [institution])

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("edubid-theme", theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"))
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}


