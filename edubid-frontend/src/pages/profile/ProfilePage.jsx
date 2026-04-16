"use client"

import { useState, useEffect } from "react"
import { LockClosedIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline"
import { useAuthContext } from "../../context/AuthContext"
import EditProfileModal from "../../components/profile/EditProfileModal"
import ChangePasswordModal from "../../components/profile/ChangePasswordModal"
import DeleteAccountModal from "../../components/profile/DeleteAccountModal"

export default function ProfilePage() {
  const { user } = useAuthContext()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    const date = new Date()
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
    setCurrentDate(formattedDate)
  }, [])

  if (!user) return <p>Cargando...</p>

  const profile = user.profile || {}

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bienvenido, {user.first_name}</h1>
            <p className="text-blue-100 mt-1">{currentDate}</p>
          </div>
          <button
            onClick={() => setIsEditingProfile(true)}
            className="mt-4 sm:mt-0 bg-white text-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <PencilIcon className="h-5 w-5" />
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-orange-200 to-blue-200 border-b p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-800">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Información Personal
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Nombre Completo</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {user.first_name} {user.last_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Correo Electrónico</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user.email}</p>
                      {user.email_verified && (
                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {profile.telefono || "No registrado"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Información de la cuenta
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Rol</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 capitalize">
                      {user.role}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Institución</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {profile.institucion || "No asignada"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Idioma</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      Español
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biography - Full Width */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Biografía
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-900 leading-relaxed">
                {profile.bio || "Sin descripción"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LockClosedIcon className="h-5 w-5 text-blue-600" />
          Seguridad
        </h3>
        
        <div className="space-y-3">
          {/* Cambiar contraseña */}
          <button
            onClick={() => setIsChangingPassword(true)}
            className="w-full flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition group"
          >
            <div className="flex items-center gap-3">
              <LockClosedIcon className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Cambiar Contraseña</p>
                <p className="text-sm text-gray-600">Actualiza tu contraseña por seguridad</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Eliminar cuenta */}
          <button
            onClick={() => setIsDeletingAccount(true)}
            className="w-full flex items-center justify-between p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition group"
          >
            <div className="flex items-center gap-3">
              <TrashIcon className="h-5 w-5 text-red-600 group-hover:text-red-700" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Eliminar Cuenta</p>
                <p className="text-sm text-gray-600">Elimina permanentemente tu cuenta y datos</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modals */}
      {isEditingProfile && (
        <EditProfileModal user={user} onClose={() => setIsEditingProfile(false)} />
      )}

      {isChangingPassword && (
        <ChangePasswordModal onClose={() => setIsChangingPassword(false)} />
      )}

      {isDeletingAccount && (
        <DeleteAccountModal user={user} onClose={() => setIsDeletingAccount(false)} />
      )}
    </div>
  )
}