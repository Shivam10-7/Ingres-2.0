import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

const CtaSection = () => {
  const [ctaEmail, setCtaEmail] = useState("");

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative z-10 py-20"
    >
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-6 px-6">
        <h3 className="font-display text-xl font-semibold text-foreground whitespace-nowrap">
          Want to Get Started.
        </h3>

        <div className="flex w-full max-w-md items-center gap-2">
          <input
            type="email"
            placeholder="Your email"
            value={ctaEmail}
            onChange={(e) => setCtaEmail(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-card/70 backdrop-blur py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-glow flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Send className="h-4 w-4" />
            Send
          </motion.button>
        </div>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Join us.
        </span>
      </div>
    </motion.section>
  );
};

export default CtaSection;
