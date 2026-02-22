import { useState, useEffect } from "react";
import mapLLMResponseToCharts from "@/lib/llmMapper";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Zap } from "lucide-react";
import QueryInput from "@/components/QueryInput";
import Dashboard from "@/components/Dashboard";
import { queryAI } from "@/services/ai/provider";
import { isDomainQuery, DOMAIN_ERROR_MESSAGE } from "@/services/domain/validator";
import type { ChartData } from "@/types/chart";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const handleQuery = async (query: string) => {
    // Domain validation
    if (!isDomainQuery(query)) {
      toast({
        title: "Out of Domain",
        description: DOMAIN_ERROR_MESSAGE,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setActiveQuery(query);
    setCharts([]);

    try {
      const response = await queryAI(query);
      setCharts(response.charts);
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      toast({
        title: "Error",
        description: "Failed to generate charts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to server WebSocket for realtime chart updates
  useEffect(() => {
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket("ws://localhost:8081");

      ws.addEventListener("open", () => {
        console.log("Realtime WS connected");
      });

      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === "chart_update" && Array.isArray(data.charts)) {
            // Replace or merge charts with realtime payload
            setCharts(data.charts);
            return;
          }

          // If server sent an LLM-style payload { success, data: [...] }
          if (data && data.success && Array.isArray(data.data)) {
            const mapped = mapLLMResponseToCharts(data);
            if (mapped.length) setCharts(mapped);
            return;
          }
        } catch (err) {
          // ignore parse errors
        }
      });
    } catch (err) {
      console.warn("WS connection failed", err);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              AquaLens
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-mono text-muted-foreground">
              Groundwater Analytics
            </span>
          </div>
        </div>
      </header>

      {/* Hero / Query Section */}
      <section className="container max-w-7xl mx-auto px-6 pt-16 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            <span className="gradient-text">Groundwater</span>{" "}
            <span className="text-foreground">Intelligence Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Explore India's groundwater data — extraction, recharge, and resource
            categorization powered by CGWB 2024 assessment data.
          </p>
        </motion.div>

        <QueryInput onSubmit={handleQuery} isLoading={isLoading} />
      </section>

      {/* Results */}
      <section className="container max-w-7xl mx-auto px-6 pb-16">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-20"
            >
              <div className="relative">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-b-accent/30 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Analyzing groundwater data for
                </p>
                <p className="text-xs font-mono text-primary mt-1 max-w-md truncate">
                  "{activeQuery}"
                </p>
              </div>
            </motion.div>
          )}

          {!isLoading && charts.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                <span className="text-xs font-mono text-muted-foreground">
                  {charts.length} chart{charts.length > 1 ? "s" : ""} generated
                </span>
                <span className="text-xs text-border">•</span>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-sm">
                  {activeQuery}
                </span>
              </div>
              <Dashboard charts={charts} />
            </motion.div>
          )}

          {!isLoading && charts.length === 0 && !activeQuery && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mb-4">
                <Droplets className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Enter a groundwater query above or click a sample to generate
                analytical charts from CGWB 2024 data
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Index;
