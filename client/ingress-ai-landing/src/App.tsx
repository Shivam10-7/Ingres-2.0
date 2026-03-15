import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ChatPage from "./pages/Chat";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLoaded = () => {
      // Keep preloader visible a bit longer, then fade into content smoothly
      setTimeout(() => setLoading(false), 3000);
    };

    if (document.readyState === "complete") {
      handleLoaded();
    } else {
      window.addEventListener("load", handleLoaded);
      return () => window.removeEventListener("load", handleLoaded);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* Preloader overlay */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="preloader"
              className="fixed inset-0 z-[9999] bg-black"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <video
                src="/Preloader.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noplaybackrate noremoteplayback"
                className="h-full w-full object-cover select-none pointer-events-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main app content with smooth fade-in once preloader finishes */}
        <motion.div
          key="app-shell"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: loading ? 0 : 1, y: loading ? 12 : 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <BrowserRouter>
            <Routes>
              {/* Landing page - accessible to all */}
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Index />} />
              <Route path="/login" element={<Login />} />

              {/* Chat page - protected (requires login) */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </motion.div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
