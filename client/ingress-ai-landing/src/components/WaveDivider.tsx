import { motion } from "framer-motion";

const WaveDivider = ({ flip = false }: { flip?: boolean }) => (
  <div className={`relative z-10 h-16 -my-1 pointer-events-none overflow-hidden ${flip ? "rotate-180" : ""}`}>
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="absolute bottom-0 w-full h-full"
      fill="none"
    >
      <motion.path
        d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
        fill="hsl(222, 80%, 33%)"
        fillOpacity="0.04"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />
    </svg>
  </div>
);

export default WaveDivider;
