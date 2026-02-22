# 🎯 Testing Real-Time Chart Generation

This guide explains how to verify that your dynamic LLM query handler is generating charts in real-time.

---

## 📍 Where Charts are Generated & Rendered

### Architecture Flow:
```
User Query
   ↓
QueryInput Component
   ↓
Index.tsx (handleQuery)
   ↓
queryAI() → mockProvider.query()
   ↓
handleDynamicQuery() [NEW]
   ↓
Returns AIChartResponse
   ↓
Dashboard Component renders charts
```

### Key Files:
- **Chart Generation**: [`src/services/ai/mockProvider.ts`](src/services/ai/mockProvider.ts) - `handleDynamicQuery()` function
- **Chart Rendering**: [`src/pages/Index.tsx`](src/pages/Index.tsx) - Calls `queryAI(query)` and sets charts state
- **Dashboard**: [`src/components/Dashboard.tsx`](src/components/Dashboard.tsx) - Renders the actual charts

---

## ✅ Method 1: Using the Test Component (EASIEST)

### Step 1: Import Test Component
Add this to your `src/App.tsx`:

```typescript
import TestLLMHandler from '@/components/TestLLMHandler';

export default function App() {
  return (
    <div>
      <TestLLMHandler /> {/* Add for testing */}
      {/* Rest of your app */}
    </div>
  );
}
```

### Step 2: Run the App
```bash
npm run dev
```

### Step 3: Click Test Buttons
- Visit http://localhost:5173 (or your dev server port)
- Click the test buttons (Single Record, Multi Record, No Data)
- **Watch charts generate in real-time** with sample data displayed

### What You'll See:
✓ Input sample data displayed  
✓ Generated charts with titles and types  
✓ Number of charts created  
✓ Execution time for each test  

---

## ✅ Method 2: Browser Console Testing

### Quick Test:
```javascript
// In browser DevTools Console (F12)

// Import the test samples
import { SAMPLE_SINGLE_RECORD } from '@/test/mockProvider.test';

// Test with sample data
import { mockProvider } from '@/services/ai/mockProvider';

const result = await mockProvider.query(SAMPLE_SINGLE_RECORD);
console.log("Generated Charts:", result.charts);
console.log("Chart Count:", result.charts.length);
result.charts.forEach(chart => {
  console.log(`- ${chart.title} (${chart.chartType})`);
});
```

### Run All Tests:
```javascript
import { runTests } from '@/test/mockProvider.test';
await runTests();
```

---

## ✅ Method 3: Direct Testing with Real LLM Response

### Paste Your LLM Response:
```typescript
// In browser console or component
import { mockProvider } from '@/services/ai/mockProvider';

const llmResponse = {
  success: true,
  data: [
    {
      state: 'ANDHRA PRADESH',
      district: 'East Godavari',
      assessment_unit_name: 'RAJAHMUNDRY (URBAN)',
      assessment_unit_type: 'BLOCK',
      recharge_worthy_area_ha: 1737.75,
      total_annual_ground_water_recharge_ham: 168.66,
      annual_extractable_ground_water_resource_ham: 160.23,
      total_ground_water_extraction_ham: 0,
      stage_of_ground_water_extraction_percent: 8.244398677,
      categorization: 'Safe',
      year: 2024
    }
  ],
  sql_query: 'SELECT * FROM groundwater_assessments WHERE state = "ANDHRA PRADESH"',
  execution_time_ms: 0,
  rows_returned: 1,
  cached: false
};

// Test it
const charts = await mockProvider.query(llmResponse);
console.log(charts);
```

---

## 📊 Monitoring Real-Time Generation

### Browser DevTools (F12):

**1. Network Tab:**
- Open `DevTools > Network > XHR`
- Perform a query
- Check response payload structure
- Verify execution_time_ms changes

**2. Console Tab:**
```javascript
// Add logging in your component
console.log("Starting query...", new Date().getTime());
const response = await queryAI(query);
console.log("Charts received:", response.charts.length, new Date().getTime());
```

**3. Performance Tab:**
- Record a query execution
- Analyze chart generation timing
- Identify bottlenecks

### Expected Behavior:
- ✅ Charts appear **immediately** after query (800-1400ms mock delay)
- ✅ No console errors
- ✅ All specified field types are detected
- ✅ Appropriate chart types are selected
- ✅ Multiple charts if multiple visualizations are possible

---

## 🔍 Debugging Chart Generation

### Check if handleDynamicQuery is Called:
```typescript
// Add temporary logging in mockProvider.ts

async function handleDynamicQuery(response: LLMQueryResponse): Promise<AIChartResponse> {
  console.log("🔍 handleDynamicQuery called with:", response);
  // ... rest of function
  console.log("📊 Generated charts:", charts);
  return { charts };
}
```

### Verify Field Detection:
```javascript
// In browser console
const response = {
  success: true,
  data: [{ /* your sample data */ }]
};

// Check what fields are detected
const sample = response.data[0];
const numericFields = [];
const stringFields = [];

for (const [key, value] of Object.entries(sample)) {
  if (typeof value === "number") numericFields.push(key);
  if (typeof value === "string") stringFields.push(key);
}

console.log("Numeric fields:", numericFields);
console.log("String fields:", stringFields);
```

---

## 📈 Expected Chart Types by Data

| Data Structure | Charts Generated |
|---|---|
| **1 record** (single location) | Bar chart with metrics |
| **Multiple records** (same region) | Comparison bar chart + category pie chart |
| **Extraction + Recharge present** | Extraction vs Recharge bar chart |
| **Percentage fields present** | Percentage analysis bar chart |
| **No data** | "No Data Available" message |

---

## 🎬 Live Testing Workflow

```
1. Start dev server: npm run dev
   ↓
2. Open TestLLMHandler component at http://localhost:5173
   ↓
3. Click "Single Record" button
   ↓
4. See sample input data
   ↓
5. See "1 chart generated successfully!" message
   ↓
6. Check Chart Details section for:
   - Title
   - Chart type (bar/pie/line)
   - Axis labels
   - Series count
   ↓
7. Click "Multi Record" button
   ↓
8. See multiple charts generated (3-5 depending on data)
   ↓
9. Check browser console (F12) for detailed logs
   ↓
10. DONE! Charts are generating in real-time ✅
```

---

## ✨ Visual Indicators of Real-Time Generation

### Component Shows:
- ⏱️ **Timestamp** - When chart was generated
- 📊 **Chart Count** - Number of charts created
- 🎨 **Chart Types** - Bar, Pie, Line, etc.
- 📈 **Data Points** - Number of x-axis items
- 🎯 **Series Info** - How many data series per chart

### Expected Performance:
- Single record response: **~5-50ms** generation
- Multi record response: **~10-100ms** generation
- Total time including mock delay: **~800-1400ms**

---

## 🚀 Production Testing

When your LLM starts sending real data:

1. **Replace sample data** with actual LLM responses
2. **Pass to mockProvider.query()** directly
3. **Charts will auto-generate** based on detected fields
4. **No code changes needed** - handler is dynamic!

Example:
```typescript
// From your LLM
const llmResponse = await llm.generateChartQuery(userQuestion);

// Directly use in your component
const charts = await queryAI(llmResponse);
```

---

## 📝 Common Issues & Solutions

| Issue | Solution |
|---|---|
| No charts appear | Check browser console for errors, verify data structure |
| Wrong chart type | Ensure numeric fields are detected, check field names |
| Missing series | Verify numeric fields exist in sample data |
| Execution slow | Check mock delay (800-1400ms) is reasonable |
| Field names not matching | Use exact field names from your database schema |

---

## 📌 Quick Reference

**Test File Path:** `src/test/mockProvider.test.ts`  
**Test Component Path:** `src/components/TestLLMHandler.tsx`  
**Main Handler:** `src/services/ai/mockProvider.ts` > `handleDynamicQuery()`  
**UI Integration:** `src/pages/Index.tsx` > `handleQuery()`  
**Types:** `src/services/ai/types.ts` > `LLMQueryResponse`  

---

**✅ Ready to test? Go to http://localhost:5173 and click a test button!**
