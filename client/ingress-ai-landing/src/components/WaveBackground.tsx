import { motion } from "framer-motion";

const WaveBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

    {/* Wave SVGs */}
    <svg
      className="absolute bottom-0 left-0 w-[200%] h-40 opacity-[0.07] wave-animation"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="hsl(222, 80%, 33%)"
        d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,213.3C672,213,768,171,864,149.3C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L0,320Z"
      />
    </svg>
    <svg
      className="absolute bottom-0 left-0 w-[200%] h-32 opacity-[0.05] wave-animation-slow"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="hsl(187, 94%, 43%)"
        d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L0,320Z"
      />
    </svg>

    {/* Floating water bubble particles */}
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="bubble"
        style={{
          width: `${8 + i * 5}px`,
          height: `${8 + i * 5}px`,
          left: `${5 + i * 8}%`,
          animationDuration: `${10 + i * 3}s`,
          animationDelay: `${i * 1.2}s`,
        }}
      />
    ))}

    {/* Extra subtle floating orbs */}
    {[
      { size: 200, left: "70%", top: "20%", delay: 0 },
      { size: 150, left: "20%", top: "60%", delay: 2 },
      { size: 100, left: "85%", top: "70%", delay: 4 },
    ].map((orb, i) => (
      <motion.div
        key={`orb-${i}`}
        className="absolute rounded-full"
        style={{
          width: orb.size,
          height: orb.size,
          left: orb.left,
          top: orb.top,
          background: `radial-gradient(circle, hsla(217, 91%, 60%, 0.04) 0%, transparent 70%)`,
        }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{
          duration: 8 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: orb.delay,
        }}
      />
    ))}
  </div>
);

export default WaveBackground;
