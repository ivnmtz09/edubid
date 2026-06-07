export default function ParticlesBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#EA580C]/10 dark:bg-[#EA580C]/5"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle-float ${Math.random() * 10 + 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 8}s`,
            opacity: Math.random() * 0.4 + 0.1,
          }}
        />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`glow-${i}`}
          className="absolute rounded-full blur-3xl"
          style={{
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 200 + 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 70%)',
            animation: `particle-pulse ${Math.random() * 6 + 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  )
}
