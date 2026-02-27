import { useState, FormEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getSampleQueries } from "@/services/ai/provider";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const QueryInput = ({ onSubmit, isLoading }: QueryInputProps) => {
  const [query, setQuery] = useState("");
  const sampleQueries = getSampleQueries();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const handleSampleClick = (sample: string) => {
    if (!isLoading) {
      setQuery(sample);
      onSubmit(sample);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass-card-hover flex items-center gap-3 px-5 py-3.5 pr-3">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask an analytical question..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 justify-center">
        {sampleQueries.map((sample, i) => (
          <motion.button
            key={sample}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={() => handleSampleClick(sample)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border/60 rounded-full transition-all duration-200 hover:border-primary/40 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sample}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QueryInput;
