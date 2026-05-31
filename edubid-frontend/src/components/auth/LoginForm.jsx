"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuthContext } from "../../context/AuthContext";
import { authService } from "../../services/auth";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../common/LoadingSpinner";

export default function LoginForm({
  onSwitchToRegister,
  googleButtonEvent,
  compact,
}) {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetSuggestion, setShowResetSuggestion] = useState(false);
  const [failedEmail, setFailedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setShowResetSuggestion(false);

    try {
      await login({ email: data.email, password: data.password });
      toast.success("!Bienvenido de nuevo!");
    } catch (err) {
      if (err.suggestReset) {
        setShowResetSuggestion(true);
        setFailedEmail(data.email);
        toast.error("Credenciales incorrectas. ¿Olvidaste tu contrasena?");
      } else if (err.emailNotVerified) {
        toast.error("Por favor verifica tu correo electronico");
        navigate("/email-sent", {
          state: { email: err.email },
          replace: true,
        });
      } else {
        toast.error(err.message || "Error al iniciar sesion");
      }
      setIsLoading(false);
    }
  };

  const handlePasswordReset = () => {
    navigate("/forgot-password", {
      state: { email: failedEmail },
    });
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
        error.response?.data?.message || "Error al iniciar sesion con Google",
      );
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      autoComplete="off"
    >
      <input
        type="text"
        name="prevent_autofill_email"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="username"
      />
      <input
        type="password"
        name="prevent_autofill_pass"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="current-password"
      />

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Iniciar sesion
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Accede a tu cuenta para continuar aprendiendo
        </p>
      </div>

      {showResetSuggestion && (
        <div className="rounded-xl border border-[#FADBD8] bg-[#FADBD8]/20 p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#c0392b]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#c0392b] mb-2">
                ¿Olvidaste tu contrasena?
              </p>
              <p className="text-xs text-[#c0392b]/80 mb-3">
                Has intentado iniciar sesion sin exito. Puedes restablecer tu
                contrasena si no la recuerdas.
              </p>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="rounded-lg bg-[#EA580C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C2410C]"
              >
                Restablecer contrasena
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Correo electronico
          </label>
          <input
            type="email"
            {...register("email", {
              required: "El correo es requerido",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Correo electronico invalido",
              },
            })}
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 dark:border-[#3A3028] dark:bg-[#241E1A] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-[#F59E0B] dark:focus:ring-[#F59E0B]/20"
            placeholder="tu@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contrasena
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "La contrasena es requerida",
                minLength: {
                  value: 6,
                  message: "Minimo 6 caracteres",
                },
              })}
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 dark:border-[#3A3028] dark:bg-[#241E1A] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-[#F59E0B] dark:focus:ring-[#F59E0B]/20"
              placeholder="********"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowPassword((prev) => !prev)}
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

          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-medium text-[#EA580C] transition hover:text-[#C2410C] dark:text-[#FBBF24] dark:hover:text-[#FCD34D]"
            >
              ¿Olvidaste tu contrasena?
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="w-full rounded-xl bg-[#EA580C] py-3 text-sm font-semibold text-white shadow-lg shadow-[#EA580C]/20 transition-all hover:bg-[#C2410C] hover:shadow-xl hover:shadow-[#EA580C]/25 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {isSubmitting || isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            Iniciando sesion...
          </>
        ) : (
          "Iniciar sesion"
        )}
      </button>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative bg-white px-3 text-sm text-gray-400 dark:bg-[#181412] dark:text-gray-500">
          o continua con
        </div>
      </div>

      <div className="flex justify-center">
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

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        ¿No tienes una cuenta?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-[#EA580C] underline transition hover:text-[#C2410C] dark:text-[#FBBF24] dark:hover:text-[#FCD34D]"
        >
          Registrate aqui
        </button>
      </p>
    </form>
  );
}
