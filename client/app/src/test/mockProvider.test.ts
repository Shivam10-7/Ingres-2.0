/**
 * Test file to verify dynamic chart generation from LLM responses
 * Run this test to validate the handleDynamicQuery functionality
 */

import { mockProvider } from "@/services/ai/mockProvider";
import type { LLMQueryResponse } from "@/services/ai/types";

// ─── Sample LLM Response (from your example) ──────────────────────
const SAMPLE_SINGLE_RECORD: LLMQueryResponse = {
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
    "SELECT * FROM groundwater_assessments WHERE state = 'ANDHRA PRADESH' AND district = 'East Godavari'",
  execution_time_ms: 0,
  rows_returned: 1,
  cached: false,
};

// ─── Sample Multi-Record Response ──────────────────────
const SAMPLE_MULTI_RECORD: LLMQueryResponse = {
  success: true,
  data: [
    {
      state: "RAJASTHAN",
      district: "Jaisalmer",
      assessment_unit_name: "JAISALMER (RURAL)",
      categorization: "Over-Exploited",
      total_annual_ground_water_recharge_ham: 45.2,
      annual_extractable_ground_water_resource_ham: 42.5,
      total_ground_water_extraction_ham: 55.3,
      stage_of_ground_water_extraction_percent: 130.12,
      year: 2024,
    },
    {
      state: "RAJASTHAN",
      district: "Barmer",
      assessment_unit_name: "BARMER (URBAN)",
      categorization: "Critical",
      total_annual_ground_water_recharge_ham: 32.1,
      annual_extractable_ground_water_resource_ham: 30.5,
      total_ground_water_extraction_ham: 28.7,
      stage_of_ground_water_extraction_percent: 94.1,
      year: 2024,
    },
    {
      state: "RAJASTHAN",
      district: "Bikaner",
      assessment_unit_name: "BIKANER (BLOCK)",
      categorization: "Semi-Critical",
      total_annual_ground_water_recharge_ham: 55.8,
      annual_extractable_ground_water_resource_ham: 52.1,
      total_ground_water_extraction_ham: 42.3,
      stage_of_ground_water_extraction_percent: 81.3,
      year: 2024,
    },
  ],
  sql_query: "SELECT * FROM groundwater_assessments WHERE state = 'RAJASTHAN' ORDER BY categorization",
  execution_time_ms: 15,
  rows_returned: 3,
  cached: false,
};

// ─── Test Runner ──────────────────────
async function runTests() {
  console.log("🧪 Starting Mock Provider Tests\n");
  console.log("=========================================\n");

  try {
    // Test 1: Single Record
    console.log("✅ TEST 1: Single Record Response");
    console.log("─────────────────────────────────");
    console.log("Input:", SAMPLE_SINGLE_RECORD);
    const result1 = await mockProvider.query(SAMPLE_SINGLE_RECORD);
    console.log("Output Charts:", result1.charts);
    console.log("Number of charts generated:", result1.charts.length);
    console.log("");

    // Test 2: Multi-Record
    console.log("✅ TEST 2: Multi-Record Response");
    console.log("─────────────────────────────────");
    console.log("Input:", SAMPLE_MULTI_RECORD);
    const result2 = await mockProvider.query(SAMPLE_MULTI_RECORD);
    console.log("Output Charts:", result2.charts);
    console.log("Number of charts generated:", result2.charts.length);
    console.log("");

    // Test 3: Text Query (backward compatibility)
    console.log("✅ TEST 3: Text Query (Backward Compatibility)");
    console.log("─────────────────────────────────────────────");
    const textQuery = "Top 10 states by groundwater extraction";
    console.log("Input Query:", textQuery);
    const result3 = await mockProvider.query(textQuery);
    console.log("Number of charts generated:", result3.charts.length);
    console.log("Chart titles:", result3.charts.map((c) => c.title));
    console.log("");

    console.log("=========================================");
    console.log("✨ All tests completed successfully!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// ─── Export for easy testing in browser console ──────────────────────

/**
 * HOW TO TEST IN BROWSER:
 *
 * 1. Import this test file in any component or run it directly:
 *    import { SAMPLE_SINGLE_RECORD, SAMPLE_MULTI_RECORD, runTests } from '@/test/mockProvider.test';
 *
 * 2. Call runTests() in browser console:
 *    await runTests();
 *
 * 3. Or test individual samples:
 *    import { mockProvider } from '@/services/ai/mockProvider';
 *    import { SAMPLE_SINGLE_RECORD } from '@/test/mockProvider.test';
 *    const charts = await mockProvider.query(SAMPLE_SINGLE_RECORD);
 *    console.log(charts);
 */

export { SAMPLE_SINGLE_RECORD, SAMPLE_MULTI_RECORD, runTests };
