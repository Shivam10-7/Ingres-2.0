# 🚀 Quick Start: LLM Data to Charts in 3 Steps

## 📋 Overview
This setup lets your LLM write data to a JSON file, and charts auto-generate. **No complex routing, no mock data.**

---

## ✅ Step 1: File Already Created
The JSON file is ready at:
```
src/data/llm-response.json
```

It contains sample data in the correct format.

---

## ✅ Step 2: Visit the Viewer Page
One line added to your app routing. The page is ready at:
```
http://localhost:5173/llm-data
```

**Or edit `src/App.tsx` if not working:**
```typescript
import LLMDataPage from "./pages/LLMDataPage";

<Route path="/llm-data" element={<LLMDataPage />} />
```

---

## ✅ Step 3: LLM Writes → Charts Appear
Your LLM just needs to write JSON to `src/data/llm-response.json`:

### Python Example:
```python
import json
from pathlib import Path

# Your LLM response
data = {
    "success": True,
    "data": [
        {
            "state": "ANDHRA PRADESH",
            "district": "East Godavari",
            "assessment_unit_name": "RAJAHMUNDRY (URBAN)",
            "total_annual_ground_water_recharge_ham": 168.66,
            "annual_extractable_ground_water_resource_ham": 160.23,
            "total_ground_water_extraction_ham": 0,
            "stage_of_ground_water_extraction_percent": 8.244,
            "categorization": "Safe",
            "year": 2024
        }
    ],
    "sql_query": "SELECT * FROM groundwater_assessments...",
    "execution_time_ms": 100,
    "rows_returned": 1,
    "cached": False
}

# Write to JSON file
file_path = Path("src/data/llm-response.json")
with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print("✅ Charts will auto-update in 5 seconds!")
```

### Node.js Example:
```javascript
const fs = require('fs');

const data = {
  success: true,
  data: [{
    state: "ANDHRA PRADESH",
    district: "East Godavari",
    // ... rest of data
  }],
  sql_query: "SELECT * FROM groundwater_assessments...",
  execution_time_ms: 100,
  rows_returned: 1,
  cached: false
};

fs.writeFileSync(
  'src/data/llm-response.json',
  JSON.stringify(data, null, 2)
);

console.log("✅ Charts will auto-update in 5 seconds!");
```

---

## 🎯 Then What?

1. **Your LLM writes to JSON** → `src/data/llm-response.json`
2. **Page auto-refreshes every 5 seconds** (or click "Refresh")
3. **Charts appear automatically** ✨

---

## 📊 What Charts Get Generated?

The system looks at your JSON data and creates:

| Your Data Has | Chart Generated |
|---|---|
| Single record | Summary metrics |
| Multiple records | Comparison bar chart |
| Numeric fields | Bar/Line charts |
| Percentages | Analysis chart |
| Categories | Pie chart |
| Extraction + Recharge | Side-by-side comparison |

---

## 📝 JSON Format Your LLM Must Follow

```json
{
  "success": true,
  "data": [
    {
      "state": "TEXT",
      "district": "TEXT",
      "assessment_unit_name": "TEXT",
      "assessment_unit_type": "TEXT",
      "recharge_worthy_area_ha": NUMBER,
      "total_annual_ground_water_recharge_ham": NUMBER,
      "annual_extractable_ground_water_resource_ham": NUMBER,
      "total_ground_water_extraction_ham": NUMBER,
      "stage_of_ground_water_extraction_percent": NUMBER,
      "categorization": "TEXT",
      "year": NUMBER
    }
  ],
  "sql_query": "SELECT ...",
  "execution_time_ms": 0,
  "rows_returned": 1,
  "cached": false
}
```

---

## 🔄 How It Works

```
┌──────────────────────┐
│ LLM Writes JSON      │
│ src/data/            │
│ llm-response.json    │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ Frontend Fetches     │
│ (auto every 5 sec)   │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ readLLMResponse()    │
│ Analyzes JSON        │
│ Creates charts       │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ LLMDataPage Renders  │
│ Charts Display! ✨   │
└──────────────────────┘
```

---

## 🎮 Manual Testing

Don't have LLM integration yet? Test manually:

1. Open: http://localhost:5173/llm-data
2. Edit: `src/data/llm-response.json` (change some numbers)
3. Save the file
4. Charts update in 5 seconds (or click Refresh)

---

## ✨ Features

✅ **Zero Setup** - Just write JSON  
✅ **Auto-Refresh** - Every 5 seconds  
✅ **Dynamic** - Adapts to any data structure  
✅ **Simple** - No routing, no mocking  
✅ **Live** - Real-time chart generation  

---

## 📞 Having Issues?

| Problem | Fix |
|---|---|
| Charts not showing | Check console (F12) for errors |
| Page not found | Verify `/llm-data` route in App.tsx |
| Old data showing | Click "Refresh" or clear browser cache |
| JSON not valid | Check: All required fields present, proper quotes |

---

## 🎓 Next: Full Integration

Once you have this working:

1. **Connect to your actual LLM** via your backend
2. **Backend writes to JSON** when LLM responds
3. **Frontend auto-updates** with charts

See [**LLM_INTEGRATION_GUIDE.md**](./LLM_INTEGRATION_GUIDE.md) for backend examples and [**LLM_BACKEND_EXAMPLES.js**](./LLM_BACKEND_EXAMPLES.js) for code samples.

---

## 🚀 You're Ready!

Just make sure your LLM writes to:
```
src/data/llm-response.json
```

Then visit:
```
http://localhost:5173/llm-data
```

**Charts appear automatically!** ✨
