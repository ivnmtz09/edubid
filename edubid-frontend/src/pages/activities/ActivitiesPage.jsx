"use client"

import React, { useState } from "react"
import { useAuthContext } from "../../context/AuthContext"
import ActivitiesList from "../../components/activities/ActivityList"
import CreateActivity from "../../components/activities/CreateActivity"
import Modal from "../../components/common/Modal"

export default function ActivitiesPage() {
  const { user } = useAuthContext()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isTeacher = user?.role === "docente"
  const isStudent = user?.role === "estudiante"

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Listado de actividades */}
      <ActivitiesList />

      {/* Modal para crear actividad (solo docente) */}
      {isTeacher && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear nueva actividad"
          size="lg"
        >
          <CreateActivity onClose={() => setShowCreateModal(false)} />
        </Modal>
      )}
    </div>
  )
}