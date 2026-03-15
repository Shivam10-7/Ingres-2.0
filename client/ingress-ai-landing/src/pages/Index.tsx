import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircle, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useForceLightMode } from "@/hooks/useForceLightMode";
import HeroSlideshow from "@/components/HeroSlideshow";
import WaveBackground from "@/components/WaveBackground";
import WaveDivider from "@/components/WaveDivider";
import AboutSection from "@/components/AboutSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";

const Index = () => {
  useForceLightMode();

  return (
    <div className="relative min-h-screen scroll-smooth">
      <WaveBackground />
      <Navbar />

      {/* Hero – slideshow background + project info + CTAs */}
      <section id="home" className="relative z-10 flex min-h-screen items-center justify-center pt-20">
        <HeroSlideshow />
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-md">
              INGRES - AI Chatbot
            </h1>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-4 text-xl md:text-2xl font-semibold text-white/95"
            >
              Smart Access to India&apos;s Groundwater Data
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-6 text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto"
            >
              An intelligent virtual assistant for querying groundwater assessments,
              historical trends, and scientific insights from the India Ground Water
              Resource Estimation System.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/80 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white"
              >
                <MessageCircle className="h-5 w-5" />
                Start Chatting
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <BarChart3 className="h-5 w-5" />
                Explore Features
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Project description + embedded INGRES map block (just below hero background) */}
      <section className="relative z-20 -mt-10 pb-8">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mx-auto grid max-w-6xl gap-6 rounded-3xl bg-white/95 px-4 py-6 shadow-2xl shadow-black/30 backdrop-blur-md md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)] md:px-10 md:py-10"
          >
            {/* Left: description */}
            <div className="text-left space-y-4 md:space-y-5">
              <h3 className="text-lg md:text-xl font-semibold text-primary uppercase tracking-wide">
                Smart Access to India&apos;s Groundwater Data
              </h3>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                The India Groundwater Resource Estimation System (INGRES) is a GIS-based platform
                developed by the Central Ground Water Board (CGWB) to assess and monitor groundwater
                resources across India. 
              </p>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed">
              It provides detailed insights into groundwater recharge,
              extraction, and sustainability at the block and district levels.
              </p>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                INGRES AI enhances this platform with an AI-powered virtual assistant that allows
                users to query complex datasets through natural language, receive instant answers,
                visualizations, and historical analysis—making groundwater information more
                accessible to planners, researchers, policymakers, and citizens.
              </p>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed mt-3">
                To explore the official INGRES platform and access the complete groundwater
                resource assessment data, visit the portal at{" "}
                <a
                  href="https://ingres.iith.ac.in/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:underline"
                >
                  https://ingres.iith.ac.in/home
                </a>.
              </p>
            </div>

            {/* Right: embedded map HTML from public/Ingres_Map.html */}
            <div className="relative mt-4 md:mt-0 flex items-center justify-center">
              <div className="w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden bg-slate-900">
                <iframe
                  src="/Ingres_Map.html"
                  title="INGRES Groundwater Map"
                  className="h-[260px] w-full md:h-[340px] lg:h-[420px]"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <WaveDivider />
      <AboutSection />
      <WaveDivider flip />
      <FeaturesSection />
      <WaveDivider />
      <HowItWorksSection />
      <WaveDivider flip />
      <FaqSection />
      <Footer />
    </div>
  );
};

export default Index;
