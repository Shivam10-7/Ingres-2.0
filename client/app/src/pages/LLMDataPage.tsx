/**
 * Simple LLM Data Integration
 * Reads from llm-response.json and generates charts
 * No complex routing, no mock providers - just read and render
 */

import { useState, useEffect } from "react";
import { readLLMResponseAndGenerateCharts } from "@/services/llmResponseService";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Zap, RefreshCw } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChartData } from "@/types/chart";

const LLMDataPage = () => {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [dataInfo, setDataInfo] = useState<{
    rows: number;
    success: boolean;
    executionTime: number;
  } | null>(null);

  const loadCharts = async () => {
    setIsLoading(true);
    try {
      const response = await readLLMResponseAndGenerateCharts();
      setCharts(response.charts);
      setLastUpdated(new Date().toLocaleTimeString());
      
      // Fetch the raw data to show info
      const rawData = await fetch("/src/data/llm-response.json").then(r => r.json());
      setDataInfo({
        rows: rawData.data?.length || 0,
        success: rawData.success,
        executionTime: rawData.execution_time_ms,
      });
    } catch (error) {
      console.error("Failed to load charts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    loadCharts();
    
    // Optionally refresh every 5 seconds to pick up LLM updates
    const interval = setInterval(loadCharts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              AquaLens - LLM Data Viewer
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {lastUpdated && `Updated: ${lastUpdated}`}
            </div>
            <Button
              onClick={loadCharts}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Data Info Card */}
        {dataInfo && (
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-2">LLM Response Status</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {dataInfo.success ? "✅ Success" : "❌ Failed"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Records</p>
                    <p className="font-semibold">{dataInfo.rows} row(s)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Execution Time</p>
                    <p className="font-semibold">{dataInfo.executionTime}ms</p>
                  </div>
                </div>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 flex-shrink-0" />
            </div>
          </Card>
        )}

        {/* Charts */}
        {charts.length > 0 ? (
          <AnimatePresence mode="wait">
            <Dashboard charts={charts} />
          </AnimatePresence>
        ) : (
          <Card className="p-12 text-center">
            {isLoading ? (
              <div className="space-y-3">
                <div className="animate-spin inline-block">
                  <RefreshCw className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Loading charts from LLM response...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">No charts generated yet</p>
                <Button onClick={loadCharts}>Load Charts</Button>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
            📝 How to use:
          </p>
          <ol className="text-xs text-amber-800 dark:text-amber-100 space-y-1 list-decimal list-inside">
            <li>Update the JSON file: <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">src/data/llm-response.json</code></li>
            <li>Click "Refresh" button or wait for auto-refresh (5 sec)</li>
            <li>Charts generate automatically from the JSON data</li>
            <li>No complex routing or mock data - just read and render</li>
          </ol>
        </Card>
      </main>
    </div>
  );
};

export default LLMDataPage;
