"use client";

import { useState } from "react";
import {
  LockClosedIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "../../context/AuthContext";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import DeleteAccountModal from "../../components/profile/DeleteAccountModal";

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  if (!user) return <p className="p-4 text-gray-500 dark:text-gray-400">Cargando...</p>;

  const profile = user.profile || {};

  return (
    <div className="w-full h-full bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Hero Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl relative mb-16">
        {/* Edit Profile Button */}
        <button
          onClick={() => setIsEditingProfile(true)}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all backdrop-blur-sm flex items-center gap-2 text-sm font-medium active:scale-[0.96]"
        >
          <PencilIcon className="h-4 w-4" />
          Editar Perfil
        </button>

        {/* Avatar */}
        <div className="absolute bottom-0 left-8 translate-y-1/2">
          <div className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-950 bg-orange-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
        </div>
      </div>

      {/* Profile Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 mb-4">
              Informacion Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre Completo
                </p>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                  {user.first_name} {user.last_name}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Correo Electronico
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                  {user.email_verified && (
                    <span className="inline-block mt-1 text-xs bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                      Verificado
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Telefono
                </p>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                  {profile.telefono || "No registrado"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de Ingreso
                </p>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10 tabular-nums">
                  {user.date_joined
                    ? new Date(user.date_joined).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 mb-4">
              Biografia
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-white/10">
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {profile.bio || "Sin descripcion"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Account Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 mb-4">
              Informacion de la cuenta
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Rol
                </p>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10 capitalize">
                  {user.role}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Institucion
                </p>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                  {profile.institucion || "No asignada"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Idioma
                </p>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                  Espanol
                </p>
              </div>

              {user.role === "estudiante" && user.student_id && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    ID Estudiante
                  </p>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-white/10 tabular-nums">
                    {user.student_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5 text-orange-500" />
              Seguridad
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => setIsChangingPassword(true)}
                className="w-full flex items-center justify-between p-4 border-2 border-orange-200 dark:border-orange-900/20 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all group active:scale-[0.96]"
              >
                <div className="flex items-center gap-3">
                  <LockClosedIcon className="h-5 w-5 text-orange-500 group-hover:text-orange-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Cambiar Contrasena</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Actualiza tu contrasena por seguridad
                    </p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setIsDeletingAccount(true)}
                className="w-full flex items-center justify-between p-4 border-2 border-red-200 dark:border-red-900/20 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-all group active:scale-[0.96]"
              >
                <div className="flex items-center gap-3">
                  <TrashIcon className="h-5 w-5 text-red-500 group-hover:text-red-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Eliminar Cuenta</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Elimina permanentemente tu cuenta y datos
                    </p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isEditingProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditingProfile(false)}
        />
      )}

      {isChangingPassword && (
        <ChangePasswordModal onClose={() => setIsChangingPassword(false)} />
      )}

      {isDeletingAccount && (
        <DeleteAccountModal
          user={user}
          onClose={() => setIsDeletingAccount(false)}
        />
      )}
    </div>
  );
}
