import { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { BarChart3, Zap, Settings, RefreshCw } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Visualize groundwater trends, seasonal patterns, and regional statistics with interactive charts and maps.",
  },
  {
    icon: Settings,
    title: "Customizable",
    desc: "Tailor the chatbot experience to your specific data needs — filter by state, district, or assessment year.",
  },
  {
    icon: RefreshCw,
    title: "Reliable",
    desc: "Powered by official CGWB data with regular updates ensuring accuracy and trustworthiness.",
  },
  {
    icon: Zap,
    title: "Smooth & Fast",
    desc: "Lightning-fast responses with AI-optimized query processing for instant groundwater insights.",
  },
];

/* Animated SVG graph line for the dashboard preview */
const AnimatedGraph = () => (
  <svg viewBox="0 0 300 120" className="w-full" fill="none">
    <defs>
      <linearGradient id="graphGrad" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(187, 94%, 43%)" />
        <stop offset="100%" stopColor="hsl(217, 91%, 60%)" />
      </linearGradient>
      <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(187, 94%, 43%)" stopOpacity="0.2" />
        <stop offset="100%" stopColor="hsl(187, 94%, 43%)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <motion.path
      d="M0,90 C30,85 60,60 90,55 C120,50 150,70 180,45 C210,20 240,35 270,25 C285,20 295,15 300,10"
      stroke="url(#graphGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
    />
    <motion.path
      d="M0,90 C30,85 60,60 90,55 C120,50 150,70 180,45 C210,20 240,35 270,25 C285,20 295,15 300,10 L300,120 L0,120 Z"
      fill="url(#graphFill)"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 1.5 }}
    />
    {/* Data points */}
    {[
      [0, 90], [90, 55], [180, 45], [270, 25], [300, 10],
    ].map(([cx, cy], i) => (
      <motion.circle
        key={i}
        cx={cx}
        cy={cy}
        r="4"
        fill="hsl(187, 94%, 43%)"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.8 + i * 0.15, duration: 0.4, ease: "easeOut" }}
      />
    ))}
  </svg>
);

/* Dashboard preview with 3D tilt */
const DashboardPreview = () => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, x: 80 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ rotateX, rotateY, perspective: 800 }}
      className="glass-card p-6 relative group hover:border-secondary/30 transition-all duration-500"
    >
      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: "inset 0 0 30px hsla(187, 94%, 43%, 0.1), 0 0 40px hsla(217, 91%, 60%, 0.15)" }}
      />

      {/* Mini dashboard UI */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3 w-3 rounded-full bg-destructive/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
          <div className="h-3 w-3 rounded-full bg-green-400/60" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">analytics.ingres.gov.in</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {["Groundwater Level", "Recharge Rate", "Extraction"].map((label, i) => (
            <div key={label} className="rounded-xl bg-primary/5 p-3">
              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
              <p className="font-display text-sm font-bold text-foreground">
                {["12.4m", "340mm", "68%"][i]}
              </p>
            </div>
          ))}
        </div>

        <AnimatedGraph />

        <div className="flex gap-2 mt-4">
          {["Daily", "Weekly", "Monthly"].map((tab) => (
            <span
              key={tab}
              className={`text-[10px] px-3 py-1 rounded-full transition-colors ${
                tab === "Monthly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="relative z-10 py-24 bg-primary/[0.03]">
      <div className="container mx-auto px-6">
        {/* Header with animated gradient underline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold gradient-text mb-1 inline-block relative">
            Features
            <motion.span
              className="absolute -bottom-2 left-0 h-[3px] rounded-full"
              style={{ background: "var(--gradient-aqua)" }}
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mt-4">
            Everything you need to access and analyze India's groundwater data
          </p>
        </motion.div>

        {/* Cards + Dashboard */}
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          {/* Left: Feature cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.12,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 16px 48px hsla(217, 91%, 60%, 0.15)",
                }}
                className="glass-card p-5 group hover:border-secondary/40 transition-all duration-500"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors duration-500">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <f.icon className="h-5 w-5" />
                  </motion.div>
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Right: Dashboard Preview */}
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
