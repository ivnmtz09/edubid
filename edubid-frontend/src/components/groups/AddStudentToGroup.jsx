"use client"

import { useState, useEffect } from "react"
import { useAddStudentToGroup } from "../../hooks/useGroups"
import { useAuth } from "../../hooks/useAuth"
import LoadingSpinner from "../common/LoadingSpinner"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

const AddStudentToGroup = ({ group, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const addStudentToGroup = useAddStudentToGroup()
  const { user } = useAuth()

  // Mock function to search students - replace with real API call
  const searchStudents = async (term) => {
    if (!term.trim()) {
      setAvailableStudents([])
      return
    }

    setIsSearching(true)
    try {
      // This would be replaced with actual API call
      // const response = await api.get(`/users/api/v2/users/?role=estudiante&search=${term}`)

      // Mock data for now
      const mockStudents = [
        { id: 1, email: "estudiante1@example.com", first_name: "Juan", last_name: "Pérez" },
        { id: 2, email: "estudiante2@example.com", first_name: "María", last_name: "García" },
        { id: 3, email: "estudiante3@example.com", first_name: "Carlos", last_name: "López" },
      ].filter(
        (student) =>
          student.email.toLowerCase().includes(term.toLowerCase()) ||
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(term.toLowerCase()),
      )

      setAvailableStudents(mockStudents)
    } catch (error) {
      console.error("Error searching students:", error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStudents(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleStudentToggle = (student) => {
    setSelectedStudents((prev) => {
      const isSelected = prev.find((s) => s.id === student.id)
      if (isSelected) {
        return prev.filter((s) => s.id !== student.id)
      } else {
        return [...prev, student]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedStudents.length === 0) {
      return
    }

    try {
      // Add each selected student to the group
      for (const student of selectedStudents) {
        await addStudentToGroup.mutateAsync({
          groupId: group.id,
          studentId: student.id,
        })
      }
      onClose()
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="search" className="label">
          Buscar Estudiantes
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
            placeholder="Buscar por nombre o email..."
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
        {isSearching ? (
          <div className="p-4 text-center">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-500 mt-2">Buscando estudiantes...</p>
          </div>
        ) : availableStudents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {availableStudents.map((student) => {
              const isSelected = selectedStudents.find((s) => s.id === student.id)
              return (
                <div
                  key={student.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${
                    isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => handleStudentToggle(student)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleStudentToggle(student)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : searchTerm.trim() ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No se encontraron estudiantes</p>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Escribe para buscar estudiantes</p>
          </div>
        )}
      </div>

      {/* Selected Students */}
      {selectedStudents.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Estudiantes seleccionados ({selectedStudents.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedStudents.map((student) => (
              <span
                key={student.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {student.first_name} {student.last_name}
                <button
                  type="button"
                  onClick={() => handleStudentToggle(student)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={selectedStudents.length === 0 || addStudentToGroup.isPending}
          className="btn-primary flex-1"
        >
          {addStudentToGroup.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            `Agregar ${selectedStudents.length} estudiante${selectedStudents.length !== 1 ? "s" : ""}`
          )}
        </button>
      </div>
    </form>
  )
}

export default AddStudentToGroup
