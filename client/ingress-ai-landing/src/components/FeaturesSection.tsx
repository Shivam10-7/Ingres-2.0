import { useRef } from "react";
import { motion } from "framer-motion";
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

/* Dashboard preview – simplified, no 3D tilt */
const DashboardPreview = () => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
    >
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

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative z-10 border-t border-slate-200 bg-white py-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-left mb-8 border-b border-slate-200 pb-3"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Key Features
          </h2>
          <p className="text-slate-700 max-w-2xl mt-3 text-sm md:text-base">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.35,
                  delay: i * 0.08,
                  ease: "easeOut",
                }}
                whileHover={{ y: -3, boxShadow: "0 10px 20px rgba(15, 23, 42, 0.10)" }}
                className="group h-full rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-sm transition-transform transition-shadow duration-200 ease-out"
              >
                <div className="mb-2 h-0.5 w-10 bg-orange-500 group-hover:bg-blue-600" />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
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
