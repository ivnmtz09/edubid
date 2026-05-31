"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ThemeToggle from "../common/ThemeToggle";
import ParticlesBackground from "./ParticlesBackground";

function DashboardMockup() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100/80 dark:bg-white/5 border-b border-gray-200/50 dark:border-white/5">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-gray-400 dark:text-gray-500 font-mono">dashboard.edubid.app</span>
      </div>
      <div className="p-4 sm:p-6 bg-white/40 dark:bg-black/20 backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[["Cursos", "12"], ["Monedas", "2,450"], ["Retos", "8"]].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/60 dark:bg-white/5 p-3 border border-gray-200/50 dark:border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 h-20">
          {[35, 55, 42, 70, 48, 62, 80, 45, 58, 38, 72, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md transition-all duration-500"
              style={{
                height: `${h}%`,
                background: i % 3 === 0
                  ? 'linear-gradient(to top, #EA580C, #F97316)'
                  : i % 3 === 1
                    ? 'linear-gradient(to top, #2563EB, #3B82F6)'
                    : 'linear-gradient(to top, #D97706, #F59E0B)',
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function IllustrationSvg() {
  return (
    <svg width="900" height="400" viewBox="0 0 900 400" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <circle cx="750" cy="80" r="120" fill="#FF6B00" opacity="0.08"/>
      <circle cx="150" cy="320" r="140" fill="#4285F4" opacity="0.08"/>
      <rect x="200" y="80" width="500" height="240" rx="20" fill="#F9F9F9" opacity="0.9"/>
      <rect x="200" y="80" width="500" height="40" rx="20" fill="#FF6B00"/>
      <circle cx="380" cy="190" r="18" fill="#1A1A1A"/>
      <rect x="365" y="210" width="30" height="40" rx="6" fill="#FF6B00"/>
      <circle cx="460" cy="200" r="14" fill="#333"/>
      <rect x="448" y="215" width="24" height="30" rx="5" fill="#4285F4"/>
      <circle cx="520" cy="200" r="14" fill="#333"/>
      <rect x="508" y="215" width="24" height="30" rx="5" fill="#FF6B00"/>
      <rect x="430" y="140" width="50" height="20" rx="4" fill="#4285F4"/>
      <rect x="490" y="140" width="50" height="20" rx="4" fill="#FF6B00"/>
      <rect x="240" y="140" width="100" height="8" rx="4" fill="#DDD"/>
      <rect x="240" y="160" width="80" height="8" rx="4" fill="#DDD"/>
      <rect x="240" y="180" width="60" height="8" rx="4" fill="#DDD"/>
    </svg>
  )
}

export default function AuthLandingComponent() {
  const [activeForm, setActiveForm] = useState(null);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-[#181412] text-gray-900 dark:text-gray-100 overflow-hidden">
      <ParticlesBackground />

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-orange-50/30 dark:from-[#3A2A24]/15 dark:via-transparent dark:to-[#2C241E]/20 opacity-80 pointer-events-none -z-0"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Split screen */}
      <div className="relative flex min-h-screen flex-col md:flex-row z-10">
        {/* LEFT - SaaS Showcase */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-xl space-y-8">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-white/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Plataforma educativa #1 en Latinoamerica
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                Aprende,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] to-[#F97316]">
                  Gana
                </span>
                , Crece.
              </h1>
              <p className="mt-3 text-base lg:text-lg text-gray-500 dark:text-gray-400 max-w-md">
                Convierte tu conocimiento en recompensas. Desafia a otros, sube de nivel y demuestra tu talento en EduBid.
              </p>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="stroke-animate"
            >
              <DashboardMockup />
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              {[
                { label: "Gamificacion", icon: "🏆" },
                { label: "Cursos en Vivo", icon: "🎓" },
                { label: "Recompensas", icon: "🪙" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    bg-white/70 dark:bg-white/5 border border-gray-200/50 dark:border-white/10
                    text-gray-700 dark:text-gray-300
                    hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20
                    transition-all duration-200 backdrop-blur-sm"
                >
                  <span className="text-base">{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-4 text-sm"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-[#181412] bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-gray-400 dark:text-gray-500">
                <span className="font-semibold text-gray-700 dark:text-gray-300">+10,000</span> estudiantes activos
              </p>
            </motion.div>

            {/* Animated SVG */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="stroke-animate"
            >
              <IllustrationSvg />
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
                  bg-gradient-to-r from-[#EA580C] to-[#F97316]
                  hover:from-[#C2410C] hover:to-[#EA580C]
                  transition-all duration-300 active:scale-[0.98]"
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
                <img src="/assets/coins/coin.png" alt="EduBid Logo" className="w-14 h-14 object-contain" />
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                  EduBid
                </span>
              </div>
            </div>

            {/* Form card */}
            <div className="rounded-2xl p-6 sm:p-8
              bg-white dark:bg-[#241E1A]
              backdrop-blur-xl
              border border-gray-200/50 dark:border-white/10
              shadow-xl">
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
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                      Convierte el aprendizaje en una aventura. Gana monedas, sube de nivel y demuestra tu talento.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {["Aprendizaje", "Recompensas", "Retos", "Colaboracion"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-3 py-1 text-xs font-medium
                            bg-gray-100 dark:bg-white/10
                            text-gray-600 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveForm("register")}
                        className="w-full rounded-xl bg-gradient-to-r from-[#EA580C] to-[#F97316] py-3 text-sm font-semibold text-white shadow-lg shadow-[#EA580C]/25 transition-all hover:from-[#C2410C] hover:to-[#EA580C] hover:shadow-xl hover:shadow-[#EA580C]/30 active:scale-[0.98]"
                      >
                        Crear una cuenta
                      </button>

                      <button
                        onClick={() => setActiveForm("login")}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/20 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98]"
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
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#EA580C] hover:text-[#C2410C] transition-colors dark:text-[#FBBF24] dark:hover:text-[#FCD34D]"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#EA580C] hover:text-[#C2410C] transition-colors dark:text-[#FBBF24] dark:hover:text-[#FCD34D]"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
                &copy; 2026 EduBid &mdash; Aprende. Gana. Evoluciona.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
