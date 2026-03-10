import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LoginCard from "@/components/LoginCard";
import HeroIllustration from "@/components/HeroIllustration";
import WaveBackground from "@/components/WaveBackground";
import WaveDivider from "@/components/WaveDivider";
import CtaSection from "@/components/CtaSection";
import AboutSection from "@/components/AboutSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";

const Index = () => {
  // Landing page is always shown - no auto-redirect based on auth
  // Users can login here or visit as guests
  // Protected /chat route will handle authentication checks

  return (
    <div className="relative min-h-screen scroll-smooth">
      <WaveBackground />
      <Navbar />

      {/* Hero – split screen */}
      <section id="home" className="relative z-10 flex min-h-screen items-center pt-20">
        <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left: text + login */}
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight text-foreground">
                Empowering Water{" "}
                <span className="gradient-text">Intelligence</span>{" "}
                with AI
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mt-4 max-w-md text-base text-muted-foreground leading-relaxed"
              >
                Jal Sathi — Your smart assistant for water services, complaints,
                and awareness.
              </motion.p>
            </motion.div>

            <LoginCard />
          </div>

          {/* Right: illustration */}
          <div className="hidden lg:flex justify-center">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <WaveDivider />
      <AboutSection />
      <WaveDivider flip />
      <FeaturesSection />
      <WaveDivider />
      <HowItWorksSection />
      <WaveDivider flip />
      <CtaSection />
      <FaqSection />
      <Footer />
    </div>
  );
};

export default Index;
