import { motion } from "framer-motion";
import { MessageSquare, Cpu, PieChart, Download } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MessageSquare,
    title: "Ask Your Question",
    desc: "Type your query in natural language — ask about groundwater levels, assessment results, or specific regions.",
  },
  {
    num: "02",
    icon: Cpu,
    title: "AI Processing",
    desc: "The ChatBOT analyzes your query, understands context, and searches the INGRES database for relevant information.",
  },
  {
    num: "03",
    icon: PieChart,
    title: "Receive Insights",
    desc: "Get clear, accurate answers with supporting data, visualizations, and relevant statistics.",
  },
  {
    num: "04",
    icon: Download,
    title: "Export & Share",
    desc: "Download reports, share findings, or continue exploring with follow-up questions.",
  },
];

/* Animated dotted SVG line connecting the steps */
const ConnectingLine = () => (
  <svg
    className="hidden lg:block absolute top-[4rem] left-[10%] right-[10%] h-8 pointer-events-none"
    viewBox="0 0 1000 30"
    preserveAspectRatio="none"
    fill="none"
  >
    <motion.path
      d="M0,15 C100,5 150,25 250,15 C350,5 400,25 500,15 C600,5 650,25 750,15 C850,5 900,25 1000,15"
      stroke="hsl(217, 91%, 60%)"
      strokeWidth="2"
      strokeDasharray="8 6"
      strokeLinecap="round"
      strokeOpacity="0.3"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
    />
  </svg>
);

const HowItWorksSection = () => {
  return (
    <section className="relative z-10 py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Get groundwater insights in four simple steps
          </p>
        </motion.div>

        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <ConnectingLine />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.6,
                delay: i * 0.18,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Number circle with pulse */}
              <motion.div
                className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary bg-background"
                whileInView={{
                  boxShadow: [
                    "0 0 0 0 hsla(222, 80%, 33%, 0)",
                    "0 0 0 12px hsla(222, 80%, 33%, 0.12)",
                    "0 0 0 0 hsla(222, 80%, 33%, 0)",
                  ],
                }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.5 + i * 0.18,
                  duration: 1.2,
                  ease: "easeOut",
                }}
                whileHover={{
                  scale: 1.1,
                  borderColor: "hsl(187, 94%, 43%)",
                }}
              >
                <span className="font-display text-lg font-bold text-primary">
                  {step.num}
                </span>
              </motion.div>

              {/* Icon with micro-interaction */}
              <motion.div
                whileHover={{ scale: 1.2, rotate: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <step.icon className="h-6 w-6 text-secondary mb-3" />
              </motion.div>

              <h3 className="font-display text-base font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-12 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-5 py-2 text-sm text-secondary font-medium">
            ⚡ Average response time: Under 3 seconds
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
