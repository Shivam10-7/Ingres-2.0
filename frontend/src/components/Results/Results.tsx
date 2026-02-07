/**
 * Results Component
 * Displays query results in table format with statistics
 */

import React, { useMemo } from "react";
import { CATEGORIZATION_MAP } from "../../types/index.ts";
import type{
  GroundwaterAssessment,
  QueryMetadata, 
  
} from "../../types/index.ts";
import { calculateResultsStatistics, exportResultsAsCSV, exportResultsAsJSON } from "../../services/query.service";
import "./Results.css";

interface ResultsProps {
  data: GroundwaterAssessment[];
  metadata?: QueryMetadata | null;
}

const Results: React.FC<ResultsProps> = ({ data, metadata }) => {
  const stats = useMemo(() => calculateResultsStatistics(data), [data]);

  const getCategoryColor = (category: string): string => {
    const map = CATEGORIZATION_MAP[category as keyof typeof CATEGORIZATION_MAP];
    return map?.color || "#6b7280";
  };

  const handleExportCSV = () => {
    const filename = `ingres_results_${new Date().toISOString().split("T")[0]}.csv`;
    exportResultsAsCSV(data, filename);
  };

  const handleExportJSON = () => {
    const filename = `ingres_results_${new Date().toISOString().split("T")[0]}.json`;
    exportResultsAsJSON(data, metadata || undefined, filename);
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Query Results</h2>
        <div className="export-buttons">
          <button onClick={handleExportCSV} className="export-btn">
            📥 Download CSV
          </button>
          <button onClick={handleExportJSON} className="export-btn">
            📥 Download JSON
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{stats.totalRows}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Extraction Stage</div>
          <div className="stat-value">{stats.avgExtractionStage}%</div>
        </div>
        <div className="stat-card safe">
          <div className="stat-label">Safe</div>
          <div className="stat-value">{stats.safCount}</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-label">Critical</div>
          <div className="stat-value">{stats.criticalCount}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Over Exploited</div>
          <div className="stat-value">{stats.overExploitedCount}</div>
        </div>
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="metadata-section">
          <p className="metadata-text">
            <strong>Execution Time:</strong> {metadata.execution_time_ms}ms |
            <strong> Rows:</strong> {metadata.rows_returned} |
            <strong> Status:</strong> {metadata.cached ? "✅ Cached" : "🔄 Fresh"}
          </p>
          <details className="sql-query-details">
            <summary>View SQL Query</summary>
            <pre className="sql-query-code">{metadata.sql_query}</pre>
          </details>
        </div>
      )}

      {/* Results Table */}
      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>State</th>
              <th>District</th>
              <th>Block</th>
              <th>Year</th>
              <th>Recharge Area (ha)</th>
              <th>Annual Recharge (HAM)</th>
              <th>Extractable (HAM)</th>
              <th>Extraction (HAM)</th>
              <th>Stage %</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className={`row-${row.categorization.toLowerCase().replace(/\s+/g, "-")}`}>
                <td>{row.state}</td>
                <td>{row.district}</td>
                <td>{row.assessment_unit_name}</td>
                <td>{row.year}</td>
                <td className="number">{row.recharge_worthy_area_ha.toFixed(2)}</td>
                <td className="number">{row.total_annual_ground_water_recharge_ham.toFixed(2)}</td>
                <td className="number">{row.annual_extractable_ground_water_resource_ham.toFixed(2)}</td>
                <td className="number">{row.total_ground_water_extraction_ham.toFixed(2)}</td>
                <td className="number">
                  <span className="stage-percent">{row.stage_of_ground_water_extraction_percent.toFixed(1)}%</span>
                </td>
                <td>
                  <span
                    className="category-badge"
                    style={{
                      backgroundColor: getCategoryColor(row.categorization),
                      color: "white",
                    }}
                  >
                    {row.categorization}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Results;
