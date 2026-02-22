# 📊 LLM Data Integration Guide

This is a **simple, straightforward** way to integrate LLM responses with chart generation. No complex mocking, no routing logic - just:

1. **LLM writes data** → `src/data/llm-response.json`
2. **Frontend reads** → Auto-generates charts
3. **Charts render** → Real-time visualization

---

## 🚀 Quick Start

### Step 1: LLM Writes JSON
Your LLM should write the response to this file:

**Path:** `src/data/llm-response.json`

**Format:**
```json
{
  "success": true,
  "data": [
    {
      "state": "ANDHRA PRADESH",
      "district": "East Godavari",
      "assessment_unit_name": "RAJAHMUNDRY (URBAN)",
      "assessment_unit_type": "BLOCK",
      "recharge_worthy_area_ha": 1737.75,
      "total_annual_ground_water_recharge_ham": 168.66,
      "annual_extractable_ground_water_resource_ham": 160.23,
      "total_ground_water_extraction_ham": 0,
      "stage_of_ground_water_extraction_percent": 8.244398677,
      "categorization": "Safe",
      "year": 2024
    }
  ],
  "sql_query": "SELECT * FROM groundwater_assessments WHERE state = 'ANDHRA PRADESH'",
  "execution_time_ms": 125,
  "rows_returned": 1,
  "cached": false
}
```

### Step 2: User Visits the Page
- Navigate to: **http://localhost:5173/llm-data**
- Charts auto-load and refresh every 5 seconds
- Or click "Refresh" button for instant update

### Step 3: Charts Generate Automatically
The system automatically detects:
- ✅ Numeric fields → Bar/Line charts
- ✅ Percentage fields → Analysis charts
- ✅ Categories → Pie charts
- ✅ Multiple records → Comparison charts

---

## 📁 File Structure

```
src/
├── data/
│   └── llm-response.json ← LLM writes here
├── services/
│   └── llmResponseService.ts ← Reads & generates charts
├── pages/
│   ├── Index.tsx ← Original page
│   └── LLMDataPage.tsx ← LLM data viewer (NEW)
└── App.tsx ← Routes configured
```

---

## 🔄 How It Works

### Architecture Flow

```
llm-response.json
       ↓
readLLMResponseAndGenerateCharts()
       ↓
generateChartsFromData()
       ↓
- Detects fields (numeric, string, percent)
- Creates appropriate charts
- Analyzes data relationships
       ↓
AIChartResponse {charts}
       ↓
LLMDataPage renders them
```

---

## 📊 What Charts Are Generated?

| Data Type | Chart Generated |
|---|---|
| **Single Record** | Summary metrics bar chart |
| **Multiple Records** | Comparison bar chart |
| **Has Percentages** | Percentage analysis chart |
| **Has Categories** | Category distribution pie chart |
| **Has Extraction + Recharge** | Extraction vs Recharge bar chart |

### Example Outputs:

**Single Record Input:**
```json
{
  "data": [{
    "state": "RAJASTHAN",
    "total_annual_ground_water_recharge_ham": 168.66,
    "annual_extractable_ground_water_resource_ham": 160.23,
    "total_ground_water_extraction_ham": 0,
    "stage_of_ground_water_extraction_percent": 8.244
  }]
}
```
**Output:** 1 metrics summary chart

**Multi-Record Input:**
```json
{
  "data": [
    {"state": "RAJASTHAN", "...": "..."},
    {"state": "GUJARAT", "...": "..."},
    {"state": "MAHARASHTRA", "...": "..."}
  ]
}
```
**Output:** 3-5 comparison and analysis charts

---

## 🔄 Auto-Refresh Mechanism

The page **automatically refreshes every 5 seconds**:

```typescript
// In LLMDataPage.tsx
useEffect(() => {
  const interval = setInterval(loadCharts, 5000);
  return () => clearInterval(interval);
}, []);
```

So LLM writes to JSON → Page automatically picks it up → Charts render

Or click **"Refresh"** button for instant update.

---

## 📝 Integration with Your LLM

### Example: Node.js Backend

```javascript
// server/routes/llmResponseHandler.js
const fs = require('fs');
const path = require('path');

async function saveLLMResponse(llmData) {
  const filePath = path.join(
    __dirname,
    '../../client/Echarts/insight-weaver-main/insight-weaver-main/src/data/llm-response.json'
  );
  
  fs.writeFileSync(filePath, JSON.stringify(llmData, null, 2));
  console.log('✅ LLM response saved to llm-response.json');
}

module.exports = { saveLLMResponse };
```

### Example: Python Backend

```python
# services/llm_response_handler.py
import json
import os
from pathlib import Path

def save_llm_response(llm_data: dict):
    """Save LLM response to JSON file"""
    file_path = Path(__file__).parent.parent / 'client' / 'Echarts' / \
                'insight-weaver-main' / 'insight-weaver-main' / 'src' / 'data' / \
                'llm-response.json'
    
    with open(file_path, 'w') as f:
        json.dump(llm_data, f, indent=2)
    
    print(f"✅ LLM response saved to {file_path}")
```

---

## 🚀 Real-Time Testing

### Test 1: Manual JSON Update
1. Edit `src/data/llm-response.json` directly
2. Save the file
3. Page auto-refreshes (5 sec) or click "Refresh"
4. New charts appear! ✨

### Test 2: Programmatic
```javascript
// In browser console
const fetch = require('fetch');
const data = {
  success: true,
  data: [{/* your data */}],
  sql_query: "SELECT ...",
  execution_time_ms: 100,
  rows_returned: 1,
  cached: false
};

// Write to JSON (requires backend API)
await fetch('/api/llm-response', {
  method: 'POST',
  body: JSON.stringify(data)
});

// Frontend auto-refreshes in 5 seconds
```

---

## 📌 Page URLs

| URL | Purpose |
|---|---|
| `/` | Original query-based interface |
| `/llm-data` | **New → Simple LLM data viewer** |

---

## ✅ Verification Checklist

- [ ] LLM writes valid JSON to `src/data/llm-response.json`
- [ ] JSON follows the specified format exactly
- [ ] Navigate to `http://localhost:5173/llm-data`
- [ ] Charts appear after 5 seconds or click Refresh
- [ ] Data info shows: Status, Records, Execution Time
- [ ] Charts adapt to different data structures
- [ ] No console errors

---

## 🔧 Customization

### Change Auto-Refresh Interval
Edit `src/pages/LLMDataPage.tsx`:
```typescript
// Change from 5000ms to your preferred interval
const interval = setInterval(loadCharts, 5000);
```

### Add More Chart Types
Edit `src/services/llmResponseService.ts`:
```typescript
// Add new chart generation logic in generateChartsFromData()
```

### Modify Field Detection
Edit `src/services/llmResponseService.ts`:
```typescript
// Customize field type detection logic
if (key.toLowerCase().includes("your_field")) {
  // Handle your_field specially
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|---|---|
| Charts not appearing | Check browser DevTools → Console for errors |
| JSON not loading | Verify file path: `src/data/llm-response.json` |
| Wrong chart types | Check JSON field names match schema |
| Refresh not working | Verify JSON is valid (F12 → Network → llm-response.json) |
| Data shows old values | Check timestamp — refresh clears cache |

---

## 📄 JSON Schema Reference

```typescript
interface LLMDataResponse {
  success: boolean;
  data: Array<{
    state?: string;
    district?: string;
    assessment_unit_name?: string;
    assessment_unit_type?: string;
    recharge_worthy_area_ha?: number;
    total_annual_ground_water_recharge_ham?: number;
    annual_extractable_ground_water_resource_ham?: number;
    total_ground_water_extraction_ham?: number;
    stage_of_ground_water_extraction_percent?: number;
    categorization?: string;
    year?: number;
    // Add any other fields as needed
    [key: string]: any;
  }>;
  sql_query: string;
  execution_time_ms: number;
  rows_returned: number;
  cached: boolean;
}
```

---

## ✨ Features

✅ **Zero Mock Data** - Real data from LLM  
✅ **Auto-Refresh** - 5 second intervals  
✅ **Dynamic Charts** - Adapts to any structure  
✅ **Status Display** - Shows data info  
✅ **Manual Refresh** - Instant update button  
✅ **Error Handling** - Graceful fallbacks  
✅ **TypeScript** - Full type safety  
✅ **Simple Integration** - Just write JSON → Charts appear  

---

## 🎯 Next Steps

1. **Have your LLM write to:** `src/data/llm-response.json`
2. **Visit:** http://localhost:5173/llm-data
3. **Watch charts generate automatically** ✨

That's it! No complexity, just data → charts.
