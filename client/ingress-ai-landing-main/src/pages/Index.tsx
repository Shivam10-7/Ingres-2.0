import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LoginCard from "@/components/LoginCard";
import HeroIllustration from "@/components/HeroIllustration";
import WaveBackground from "@/components/WaveBackground";
import CtaSection from "@/components/CtaSection";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <WaveBackground />
      <Navbar />

      {/* Hero – split screen */}
      <section className="relative z-10 flex min-h-screen items-center pt-20">
        <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left: text + login */}
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight text-foreground">
                Empowering Water{" "}
                <span className="gradient-text">Intelligence</span>{" "}
                with AI
              </h1>
              <p className="mt-4 max-w-md text-base text-muted-foreground leading-relaxed">
                Jal Sathi — Your smart assistant for water services, complaints,
                and awareness.
              </p>
            </motion.div>

            <LoginCard />
          </div>

          {/* Right: illustration */}
          <div className="hidden lg:flex justify-center">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CtaSection />
    </div>
  );
};

export default Index;
