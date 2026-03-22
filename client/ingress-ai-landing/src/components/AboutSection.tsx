import { useRef } from "react";
import { motion } from "framer-motion";
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

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative z-10 border-t border-slate-200 bg-slate-50/80 py-16"
    >
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-2xl md:text-3xl font-semibold text-slate-900 mb-8 border-b border-slate-200 pb-3"
        >
          About Us
        </motion.h2>

        <div className="relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 relative z-10"
          >
            {cards.map((card) => (
              <motion.div
                key={card.title}
                variants={cardVariants}
                whileHover={{ y: -4, boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)" }}
                className="group h-full rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm transition-transform transition-shadow duration-200 ease-out"
              >
                <div className="mb-2 h-0.5 w-10 bg-orange-500 group-hover:bg-blue-600" />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <card.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
