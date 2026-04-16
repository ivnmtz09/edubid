import logo from "../../assets/edubid.png";
import { motion } from "framer-motion";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-orange-100 via-orange-50 to-white overflow-hidden">
      <motion.img
        src={logo}
        alt="EduBid Logo"
        className="w-24 h-24 drop-shadow-xl"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear",
        }}
      />

      <motion.div
        className="mt-8 text-[#f97316] font-semibold text-lg tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Cargando EduBid...
      </motion.div>

      {/* Glow animado */}
      <motion.div
        className="absolute w-[400px] h-[400px] bg-[#f97316] rounded-full blur-3xl opacity-30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default LoadingScreen;
