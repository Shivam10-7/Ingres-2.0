import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-illustration.png";

const HeroIllustration = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 40;
      const y = (e.clientY - rect.top - rect.height / 2) / 40;
      containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="relative flex items-center justify-center"
    >
      <div
        ref={containerRef}
        className="transition-transform duration-300 ease-out"
      >
        <img
          src={heroImg}
          alt="Jal Sathi AI chatbot helping users with water services"
          className="w-full max-w-lg animate-float drop-shadow-2xl"
        />
      </div>

      {/* Decorative ring */}
      <div className="absolute -z-10 h-[80%] w-[80%] rounded-full border border-secondary/20 animate-pulse" />
      <div className="absolute -z-10 h-[95%] w-[95%] rounded-full border border-primary/10" />
    </motion.div>
  );
};

export default HeroIllustration;
