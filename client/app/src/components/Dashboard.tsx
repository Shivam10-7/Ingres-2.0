import { motion } from "framer-motion";
import ChartRenderer from "./ChartRenderer";
import type { ChartData } from "@/types/chart";

interface DashboardProps {
  charts: ChartData[];
}

const Dashboard = ({ charts }: DashboardProps) => {
  if (charts.length === 0) return null;

  return (
    <div className="chart-grid">
      {charts.map((chart, index) => (
        <motion.div
          key={`${chart.title}-${index}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
        >
          <ChartRenderer chart={chart} />
        </motion.div>
      ))}
    </div>
  );
};

export default Dashboard;
