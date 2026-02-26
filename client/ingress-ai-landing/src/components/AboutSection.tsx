import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Brain, Globe, Handshake, TrendingUp } from "lucide-react";

const cards = [
  {
    icon: Brain,
    title: "Our Purpose",
    desc: "To make groundwater resource data accessible to everyone — planners, researchers, policymakers, and citizens — through an intuitive AI-powered interface.",
  },
  {
    icon: Globe,
    title: "Advanced Technology",
    desc: "Built on cutting-edge natural language processing and integrated with the INGRES database for accurate, real-time information retrieval.",
  },
  {
    icon: Handshake,
    title: "Government Collaboration",
    desc: "Developed in coordination with CGWB, State Ground Water Departments, and the Central Level Expert Group under MoJS.",
  },
  {
    icon: TrendingUp,
    title: "National Impact",
    desc: "Supporting evidence-based decision making for sustainable groundwater management across all States and Union Territories of India.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* Flowing water SVG path connecting cards */
const FlowingLines = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block"
    viewBox="0 0 1200 400"
    preserveAspectRatio="none"
    fill="none"
  >
    <defs>
      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(187, 94%, 43%)" stopOpacity="0.1" />
        <stop offset="50%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="hsl(187, 94%, 43%)" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <motion.path
      d="M150,200 C250,100 350,300 450,200 C550,100 650,300 750,200 C850,100 950,300 1050,200"
      stroke="url(#flowGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    />
    <motion.path
      d="M150,220 C250,120 350,320 450,220 C550,120 650,320 750,220 C850,120 950,320 1050,220"
      stroke="url(#flowGrad)"
      strokeWidth="1"
      strokeLinecap="round"
      strokeDasharray="6 6"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 3, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
    />
  </svg>
);

/* Subtle animated background waves */
const BackgroundWaves = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
    <svg className="absolute bottom-0 w-[200%] h-48 wave-animation" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="hsl(222, 80%, 33%)" d="M0,160L60,170.7C120,181,240,203,360,192C480,181,600,139,720,128C840,117,960,139,1080,160C1200,181,1320,203,1380,213.3L1440,224L1440,320L0,320Z" />
    </svg>
  </div>
);

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 60;
      const y = (e.clientY - rect.top - rect.height / 2) / 60;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section id="about" ref={sectionRef} className="relative z-10 py-24 overflow-hidden">
      <BackgroundWaves />

      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-display text-3xl md:text-4xl font-bold text-foreground mb-16"
        >
          About Us
        </motion.h2>

        <div className="relative">
          <FlowingLines />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10"
            style={{ x: springX, y: springY }}
          >
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                variants={cardVariants}
                className="glass-card p-6 group transition-all duration-500 ease-out hover:border-secondary/40"
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  boxShadow: "0 20px 60px hsla(217, 91%, 60%, 0.2), 0 0 30px hsla(187, 94%, 43%, 0.1)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Floating animation wrapper */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-secondary/10 group-hover:text-secondary transition-colors duration-500">
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <card.icon className="h-6 w-6" />
                    </motion.div>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.desc}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
