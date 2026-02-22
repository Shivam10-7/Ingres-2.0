/**
 * Test Component for Dynamic Query Handler
 * Use this component to visually test chart generation in real-time
 *
 * Add to your App.tsx:
 * import TestLLMHandler from '@/components/TestLLMHandler';
 *
 * Then render: <TestLLMHandler />
 */

import { useState } from "react";
import { mockProvider } from "@/services/ai/mockProvider";
import type { LLMQueryResponse } from "@/services/ai/types";
import type { AIChartResponse } from "@/types/chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestResult {
  input: LLMQueryResponse;
  output: AIChartResponse;
  timestamp: string;
}

// Sample test data
const SAMPLES = {
  singleRecord: {
    success: true,
    data: [
      {
        state: "ANDHRA PRADESH",
        district: "East Godavari",
        assessment_unit_name: "RAJAHMUNDRY (URBAN)",
        assessment_unit_type: "BLOCK",
        recharge_worthy_area_ha: 1737.75,
        total_annual_ground_water_recharge_ham: 168.66,
        annual_extractable_ground_water_resource_ham: 160.23,
        total_ground_water_extraction_ham: 0,
        stage_of_ground_water_extraction_percent: 8.244398677,
        categorization: "Safe",
        year: 2024,
      },
    ],
    sql_query:
      "SELECT * FROM groundwater_assessments WHERE state = 'ANDHRA PRADESH'",
    execution_time_ms: 0,
    rows_returned: 1,
    cached: false,
  } as LLMQueryResponse,

  multiRecord: {
    success: true,
    data: [
      {
        state: "RAJASTHAN",
        district: "Jaisalmer",
        assessment_unit_name: "JAISALMER",
        categorization: "Over-Exploited",
        total_annual_ground_water_recharge_ham: 45.2,
        annual_extractable_ground_water_resource_ham: 42.5,
        total_ground_water_extraction_ham: 55.3,
        stage_of_ground_water_extraction_percent: 130.12,
      },
      {
        state: "RAJASTHAN",
        district: "Barmer",
        assessment_unit_name: "BARMER",
        categorization: "Critical",
        total_annual_ground_water_recharge_ham: 32.1,
        annual_extractable_ground_water_resource_ham: 30.5,
        total_ground_water_extraction_ham: 28.7,
        stage_of_ground_water_extraction_percent: 94.1,
      },
      {
        state: "RAJASTHAN",
        district: "Bikaner",
        assessment_unit_name: "BIKANER",
        categorization: "Safe",
        total_annual_ground_water_recharge_ham: 55.8,
        annual_extractable_ground_water_resource_ham: 52.1,
        total_ground_water_extraction_ham: 42.3,
        stage_of_ground_water_extraction_percent: 81.3,
      },
    ],
    sql_query: "SELECT * FROM groundwater_assessments WHERE state = 'RAJASTHAN'",
    execution_time_ms: 15,
    rows_returned: 3,
    cached: false,
  } as LLMQueryResponse,

  noData: {
    success: false,
    data: [],
    sql_query: "SELECT * FROM groundwater_assessments WHERE state = 'XYZ'",
    execution_time_ms: 5,
    rows_returned: 0,
    cached: false,
  } as LLMQueryResponse,
};

export default function TestLLMHandler() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("single");

  const runTest = async (sampleKey: keyof typeof SAMPLES) => {
    setIsLoading(true);
    try {
      const sample = SAMPLES[sampleKey];
      const output = await mockProvider.query(sample);
      const result: TestResult = {
        input: sample,
        output,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResults((prev) => [result, ...prev]);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-background min-h-screen">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">🧪 LLM Query Handler Test</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Test real-time chart generation with sample LLM responses
        </p>
      </div>

      {/* Test Buttons */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Test Samples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            onClick={() => runTest("singleRecord")}
            disabled={isLoading}
            variant="outline"
            className="justify-start"
          >
            {isLoading ? "Running..." : "Single Record"}
          </Button>
          <Button
            onClick={() => runTest("multiRecord")}
            disabled={isLoading}
            variant="outline"
            className="justify-start"
          >
            {isLoading ? "Running..." : "Multi Record"}
          </Button>
          <Button
            onClick={() => runTest("noData")}
            disabled={isLoading}
            variant="outline"
            className="justify-start"
          >
            {isLoading ? "Running..." : "No Data Error"}
          </Button>
        </div>
      </Card>

      {/* Results Display */}
      {results.length > 0 && (
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold">Test Results ({results.length})</h2>
          <Tabs defaultValue="latest" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="latest">Latest Result</TabsTrigger>
              <TabsTrigger value="all">All Results</TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="space-y-4">
              {results[0] && (
                <div className="space-y-4 mt-4">
                  <div className="bg-muted p-3 rounded space-y-2">
                    <p className="text-sm font-mono text-muted-foreground">
                      {results[0].timestamp}
                    </p>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        INPUT DATA:
                      </p>
                      <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(results[0].input, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-semibold">GENERATED CHARTS:</p>
                    <div className="grid grid-cols-1 gap-3">
                      {results[0].output.charts.map((chart, idx) => (
                        <Card key={idx} className="p-3 bg-muted/50">
                          <div className="space-y-2">
                            <p className="font-semibold text-sm">{chart.title}</p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>
                                <span className="font-mono bg-background px-2 py-1 rounded">
                                  {chart.chartType}
                                </span>
                              </p>
                              <p>
                                X-Axis: {chart.xAxis.label} ({chart.xAxis.data.length} items)
                              </p>
                              <p>Y-Axis: {chart.yAxis.label}</p>
                              <p>Series: {chart.series.length} dataset(s)</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                      ✅ {results[0].output.charts.length} chart(s) generated successfully!
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, idx) => (
                  <Card key={idx} className="p-3 bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {result.timestamp}
                        </p>
                        <p className="text-sm font-semibold">
                          {result.output.charts.length} charts generated
                        </p>
                      </div>
                      <span className="text-xs bg-background px-2 py-1 rounded">
                        {result.output.charts[0]?.chartType || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {result.output.charts.map((c) => c.title).join(", ")}
                    </p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📌 How to verify real-time generation:
        </p>
        <ul className="text-xs text-blue-800 dark:text-blue-100 space-y-1">
          <li>✓ Click any test button above</li>
          <li>✓ Watch for charts to appear in the "Generated Charts" section below</li>
          <li>✓ Check browser console (F12) for detailed logs</li>
          <li>✓ Try with different samples to see how charts adapt</li>
          <li>✓ Monitor the execution time to detect real-time responses</li>
        </ul>
      </Card>
    </div>
  );
}
