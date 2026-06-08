"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ThemeToggle from "../common/ThemeToggle";
import DotGrid from "../DotGrid";
import { useTheme } from "../../context/useTheme";

export default function AuthLandingComponent() {
  const [activeForm, setActiveForm] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="fixed inset-0 w-full h-full -z-10 bg-gray-50 dark:bg-gray-950">
        <DotGrid
          baseColor={isDark ? "#374151" : "#D1D5DB"}
          activeColor="#EA580C"
          dotSize={8}
          gap={30}
          proximity={120}
          speedTrigger={50}
          shockRadius={200}
          shockStrength={8}
          maxSpeed={3000}
          resistance={600}
          returnDuration={1.2}
        />
      </div>

      {/* Theme Toggle - minimal icon button */}
      <motion.div
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ThemeToggle />
      </motion.div>

      {/* Split screen */}
      <div className="relative flex min-h-screen flex-col md:flex-row z-0">
        {/* LEFT - SaaS Showcase */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-xl space-y-8 p-8 bg-transparent relative z-10">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-gray-100/80 dark:bg-gray-800/60 shadow-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Plataforma educativa #1 en Colombia
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg leading-tight text-wrap-balance">
                Aprende, <span className="text-orange-600">Gana</span>, Crece.
              </h1>
              <p className="mt-3 text-base lg:text-lg text-gray-900 dark:text-gray-100 drop-shadow-lg max-w-md font-bold">
                Convierte tu conocimiento en recompensas. Desafia a otros, sube
                de nivel y demuestra tu talento en EduBid.
              </p>
            </motion.div>

            {/* EduBid logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex justify-center"
            >
              <img
                src="/edubid_s.svg"
                alt="EduBid"
                className="w-96 sm:w-128 h-auto object-contain"
              />
            </motion.div>

            {/* CTA with glow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <button
                onClick={() => setActiveForm("register")}
                className="glow-cta w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white text-sm
                  bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 hover:shadow-xl hover:shadow-orange-600/25
                  transition-all duration-300 active:scale-[0.96]"
              >
                Comienza gratis ahora
              </button>
            </motion.div>
          </div>
        </div>

        {/* RIGHT - Formulario */}
        <div className="flex w-full items-center justify-center p-4 sm:p-6 md:p-8 md:w-1/2">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Branding - Above form card */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4">
                <img
                  src="/edubid.png"
                  alt="EduBid Logo"
                  className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                />
                <span className="text-5xl font-extrabold text-gray-900 dark:text-gray-100">
                  EduBid
                </span>
              </div>
            </div>

            {/* Form card */}
            <div
              className="rounded-2xl p-6 sm:p-8
              bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-2xl
              relative z-10"
            >
              <AnimatePresence mode="wait">
                {!activeForm ? (
                  <motion.div
                    key="cta"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
                      !Bienvenido!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                      Convierte el aprendizaje en una aventura. Gana monedas,
                      sube de nivel y demuestra tu talento.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {[
                        "Aprendizaje",
                        "Recompensas",
                        "Retos",
                        "Colaboracion",
                      ].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-3 py-1 text-xs font-medium
                              bg-gray-100 dark:bg-gray-800
                              text-gray-600 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveForm("register")}
                        className="w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-xl hover:shadow-orange-600/25 active:scale-[0.96]"
                      >
                        Crear una cuenta
                      </button>

                      <button
                        onClick={() => setActiveForm("login")}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.96]"
                      >
                        Iniciar sesion
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {activeForm === "login" && (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mb-6">
                          <button
                            onClick={() => setActiveForm(null)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-500 transition-all active:scale-[0.96]"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Volver al inicio
                          </button>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                          Accede a tu cuenta
                        </h2>
                        <LoginForm
                          compact
                          onSwitchToRegister={() => setActiveForm("register")}
                          googleButtonEvent="google-btn-click"
                        />
                      </motion.div>
                    )}

                    {activeForm === "register" && (
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mb-6">
                          <button
                            onClick={() => setActiveForm(null)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-500 transition-all active:scale-[0.96]"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Volver al inicio
                          </button>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                          Regístrate
                        </h2>
                        <RegisterForm
                          compact
                          onSwitchToLogin={() => setActiveForm("login")}
                          googleButtonEvent="google-btn-click"
                        />
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>

              {/* Footer */}
              <p className="mt-8 text-center text-xs text-gray-600 dark:text-gray-500">
                &copy; 2026 EduBid &mdash; Aprende. Gana. Evoluciona.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
