"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuthContext } from "../../context/AuthContext";
import { authService } from "../../services/auth";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../common/LoadingSpinner";
import Modal from "../common/Modal";

const TERMS_CONTENT = `
TERMINOS Y CONDICIONES DE USO DE EDUBID

1. ACEPTACION DE LOS TERMINOS
Al registrarte y utilizar la plataforma EduBid (en adelante, "la Plataforma"), aceptas los presentes Terminos y Condiciones. Si no estas de acuerdo con alguno de ellos, no debes utilizar la Plataforma.

2. DESCRIPCION DEL SERVICIO
EduBid es una plataforma educativa que permite a docentes crear actividades, subastas y retos academicos, y a estudiantes participar en ellos obteniendo recompensas (EduBids) que pueden ser canjeadas.

3. RESPONSABILIDADES DEL USUARIO
3.1. Proporcionar informacion veraz y actualizada durante el registro.
3.2. Mantener la confidencialidad de su contrasena y cuenta.
3.3. No utilizar la Plataforma para actividades fraudulentas o ilicitas.
3.4. Respetar los derechos de propiedad intelectual del contenido publicado.

4. RESPONSABILIDADES DEL DOCENTE
4.1. Crear actividades y evaluaciones que sean apropiadas para el nivel educativo.
4.2. Calificar las actividades de manera objetiva y oportuna.
4.3. Gestionar las subastas de manera transparente.

5. PROPIEDAD INTELECTUAL
El contenido generado por los usuarios en la Plataforma (actividades, tareas, comentarios) es propiedad de sus respectivos autores. EduBid se reserva el derecho de utilizar datos anonimizados con fines estadisticos y de mejora del servicio.

6. PROTECCION DE DATOS PERSONALES
EduBid da cumplimiento a la Ley Estatutaria 1581 de 2012 de Proteccion de Datos Personales y sus decretos reglamentarios. Los datos personales suministrados seran tratados, recolectados y almacenados unicamente para los fines educativos de la Plataforma. Como titular de tus datos, tienes los derechos de conocer, actualizar, rectificar, suprimir y revocar la autorizacion frente a tus datos personales. Para ejercer estos derechos, puedes contactarnos a traves de los canales dispuestos en la Plataforma. Los datos no seran compartidos con terceros sin tu consentimiento explicito, salvo las excepciones previstas en la ley. La Superintendencia de Industria y Comercio (SIC) es la entidad encargada de velar por el cumplimiento de la normativa de proteccion de datos personales en Colombia.

7. SISTEMA DE RECOMPENSAS (EDUBIDS)
7.1. Los EduBids son una moneda virtual sin valor monetario real.
7.2. No son canjeables por dinero efectivo ni transferibles fuera de la Plataforma.
7.3. La Plataforma se reserva el derecho de ajustar el sistema de recompensas.

8. LIMITACION DE RESPONSABILIDAD
EduBid no se hace responsable por:
- Danos derivados del uso incorrecto de la Plataforma.
- Interrupciones del servicio por mantenimiento o causas de fuerza mayor.
- Contenido generado por terceros dentro de la Plataforma.

9. MODIFICACIONES
EduBid se reserva el derecho de modificar estos Terminos y Condiciones en cualquier momento. Los cambios seran notificados a traves de la Plataforma.

10. LEY APLICABLE
Estos Terminos se rigen por las leyes de la Republica de Colombia. Cualquier controversia sera resuelta ante los tribunales competentes de la ciudad de Bogota, D.C., Colombia.

Ultima actualizacion: Junio 2026
`;

export default function RegisterForm({
  onSwitchToLogin,
  googleButtonEvent,
  compact,
}) {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        role: data.role,
      };

      const response = await authService.register(payload);

      toast.success("!Cuenta creada! Revisa tu email");

      navigate("/email-sent", {
        state: { email: payload.email },
        replace: true,
      });
    } catch (err) {
      toast.error(err.message || "Error al crear la cuenta");
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log("Credencial de Google recibida:", credentialResponse);
    setIsLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/api/users/google/",
        { id_token: credentialResponse.credential },
      );
      console.log("Respuesta del backend:", res.data);
      const { tokens, user } = res.data;
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("!Bienvenido con Google!");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error enviando al backend:", error);
      toast.error(
        error.response?.data?.message || "Error al registrarse con Google",
      );
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Crear cuenta
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Unete a la comunidad y comienza a ganar coins
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                placeholder="Tu nombre"
                {...register("first_name", {
                  required: "El nombre es requerido",
                  minLength: {
                    value: 2,
                    message: "Minimo 2 caracteres",
                  },
                })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Apellido
              </label>
              <input
                placeholder="Tu apellido"
                {...register("last_name", {
                  required: "El apellido es requerido",
                  minLength: {
                    value: 2,
                    message: "Minimo 2 caracteres",
                  },
                })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo electronico
            </label>
            <input
              placeholder="tu@email.com"
              type="email"
              {...register("email", {
                required: "El correo es requerido",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Correo electronico invalido",
                },
              })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              ¿Cual es tu rol?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                    watch("role") === "estudiante" || !watch("role")
                      ? "border-orange-600 bg-orange-600/10 text-orange-600 shadow-sm"
                      : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    value="estudiante"
                  defaultChecked
                  {...register("role", {
                    required: "Selecciona tu rol",
                  })}
                  className="sr-only"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
                </svg>
                Estudiante
              </label>
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  watch("role") === "docente"
                    ? "border-orange-600 bg-orange-600/10 text-orange-600 shadow-sm"
                    : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="radio"
                  value="docente"
                  {...register("role", {
                    required: "Selecciona tu rol",
                  })}
                  className="sr-only"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
                Docente
              </label>
            </div>
            {errors.role && (
              <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contrasena
            </label>
            <div className="relative">
              <input
                placeholder="********"
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "La contrasena es requerida",
                  minLength: {
                    value: 6,
                    message: "Minimo 6 caracteres",
                  },
                })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 pr-11 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmar contrasena
            </label>
            <div className="relative">
              <input
                placeholder="********"
                type={showConfirm ? "text" : "password"}
                {...register("password_confirm", {
                  required: "Confirma tu contrasena",
                  validate: (v) =>
                    v === password || "Las contrasenas no coinciden",
                })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 pr-11 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirm ? (
                  <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
            {errors.password_confirm && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password_confirm.message}
              </p>
            )}
          </div>
        </div>

        {/* Terminos y Condiciones */}
        <div className="flex items-start gap-3">
          <input
            id="acceptedTerms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-orange-600 focus:ring-orange-500/20 focus:ring-offset-0"
          />
          <label htmlFor="acceptedTerms" className="text-sm text-gray-600 dark:text-gray-400">
            Acepto los{" "}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="font-medium text-orange-600 underline transition hover:text-orange-500"
            >
              Terminos y Condiciones
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading || !acceptedTerms}
          className="w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-xl hover:shadow-orange-600/25 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isSubmitting || isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative bg-white dark:bg-gray-900 px-3 text-sm text-gray-500">
            o registrate con
          </div>
        </div>

        <div className="flex justify-center">
          <div className={!acceptedTerms ? "pointer-events-none opacity-50" : ""}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Error al conectar con Google");
                setIsLoading(false);
              }}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
              locale="es"
            />
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-orange-600 underline transition hover:text-orange-500"
          >
            Inicia sesion aqui
          </button>
        </p>
      </form>

      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terminos y Condiciones" size="lg">
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed max-h-[60vh] overflow-y-auto">
          {TERMS_CONTENT}
        </div>
      </Modal>
    </>
  );
}
