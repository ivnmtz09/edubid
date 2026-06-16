"use client"

import { useState, useRef, useEffect } from "react"
import { MagnifyingGlassIcon, CheckIcon } from "@heroicons/react/24/outline"

export default function InstitutionSelect({
  value,
  onChange,
  institutions = [],
  loading = false,
  error,
  disabled = false,
  placeholder = "Buscar colegio...",
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selected = institutions.find((i) => i.id === value)

  const filtered = query
    ? institutions.filter((i) =>
        i.nombre.toLowerCase().includes(query.toLowerCase()),
      )
    : institutions

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const displayValue = open
    ? query
    : selected
      ? selected.nombre
      : ""

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
            if (value && e.target.value !== selected?.nombre) onChange("")
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false)
          }}
          placeholder={loading ? "Cargando instituciones..." : placeholder}
          disabled={disabled || loading}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-3 text-sm text-gray-400">
              Cargando...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">
              No se encontraron resultados
            </p>
          ) : (
            filtered.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => {
                  onChange(inst.id)
                  setQuery("")
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-4 py-3 text-sm text-left transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10 ${
                  value === inst.id
                    ? "bg-orange-50 dark:bg-orange-500/10 font-medium text-orange-600"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                <span className="flex-1">{inst.nombre}</span>
                {value === inst.id && (
                  <CheckIcon className="h-4 w-4 text-orange-600" />
                )}
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error.message || error}
        </p>
      )}
    </div>
  )
}
