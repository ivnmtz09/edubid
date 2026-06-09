"use client";

import React, { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import ActivityList from "../../components/activities/ActivityList";
import CreateActivity from "../../components/activities/CreateActivity";
import Modal from "../../components/common/Modal";
import {
  ClipboardDocumentListIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// Layout provee: bg-gray-50 dark:bg-gray-950, py-6, max-w-7xl, px-4 sm:px-6 lg:px-8
// Aquí NO duplicamos padding ni colores de fondo (nested canvas fix)
export default function ActivitiesPage() {
  const { user } = useAuthContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isTeacher = user?.role === "docente";

  return (
    <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300 space-y-6">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/50 rounded-xl">
            <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white [text-wrap:balance]">
              Actividades
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 [text-wrap:pretty]">
              {isTeacher
                ? "Gestiona las actividades asignadas a tus grupos"
                : "Revisa tus actividades, entregas y calificaciones"}
            </p>
          </div>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm w-full sm:w-auto shadow-sm active:scale-[0.96]"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Nueva Actividad
          </button>
        )}
      </div>

      {/* ── Activity List (filtros + stats + grid) ────────── */}
      <ActivityList onCreateClick={() => setShowCreateModal(true)} />

      {/* ── Modal Crear Actividad ─────────────────────────── */}
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
  );
}
