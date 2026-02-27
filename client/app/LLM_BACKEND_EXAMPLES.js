/**
 * Example: How Your LLM Backend Should Write to llm-response.json
 * 
 * Choose the example that matches your backend:
 * - Node.js/Express
 * - Python/Flask
 * - Python/FastAPI
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Node.js / Express Backend
// ═══════════════════════════════════════════════════════════════════════════

/*
// file: server/routes/llmHandler.js
const fs = require('fs');
const path = require('path');

async function handleLLMQuery(userQuery) {
  try {
    // 1. Call your LLM API
    const llmResponse = await callYourLLM(userQuery);
    // llmResponse should be in format:
    // {
    //   success: true/false,
    //   data: [...],
    //   sql_query: "...",
    //   execution_time_ms: 0,
    //   rows_returned: 0,
    //   cached: false
    // }

    // 2. Save to JSON file
    const filePath = path.join(
      __dirname,
      '../../client/Echarts/insight-weaver-main/insight-weaver-main/src/data/llm-response.json'
    );

    fs.writeFileSync(filePath, JSON.stringify(llmResponse, null, 2));
    console.log('✅ LLM response saved to llm-response.json');

    // 3. Return response to frontend
    res.json({ success: true, message: 'Charts updated' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// API Endpoint
app.post('/api/llm-query', async (req, res) => {
  const { query } = req.body;
  await handleLLMQuery(query);
});
*/

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Python / Flask Backend
// ═══════════════════════════════════════════════════════════════════════════

/*
# file: services/llm_handler.py
import json
import os
from pathlib import Path
from flask import Flask, request, jsonify

app = Flask(__name__)

def save_llm_response(llm_data: dict):
    """
    Save LLM response to JSON file
    
    Args:
        llm_data: Response from LLM in format {
            success: bool,
            data: list,
            sql_query: str,
            execution_time_ms: int,
            rows_returned: int,
            cached: bool
        }
    """
    # Build file path
    file_path = Path(__file__).parent.parent / \
                'client/Echarts/insight-weaver-main/insight-weaver-main/src/data/llm-response.json'
    
    # Ensure directory exists
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write JSON
    with open(file_path, 'w') as f:
        json.dump(llm_data, f, indent=2)
    
    print(f"✅ LLM response saved to {file_path}")

@app.route('/api/llm-query', methods=['POST'])
def handle_llm_query():
    try:
        data = request.json
        user_query = data.get('query')
        
        # Call your LLM
        llm_response = call_your_llm(user_query)
        
        # Save to JSON
        save_llm_response(llm_response)
        
        return jsonify({
            'success': True,
            'message': 'Charts updated',
            'data': llm_response
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def call_your_llm(query: str) -> dict:
    """
    Call your LLM and return response in required format
    """
    # ... your LLM call logic ...
    return {
        'success': True,
        'data': [...],
        'sql_query': '...',
        'execution_time_ms': 0,
        'rows_returned': 0,
        'cached': False
    }
*/

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Python / FastAPI Backend
// ═══════════════════════════════════════════════════════════════════════════

/*
# file: services/llm_api.py
import json
from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class LLMQueryRequest(BaseModel):
    query: str

class DataRecord(BaseModel):
    state: str | None = None
    district: str | None = None
    assessment_unit_name: str | None = None
    assessment_unit_type: str | None = None
    recharge_worthy_area_ha: float | None = None
    total_annual_ground_water_recharge_ham: float | None = None
    annual_extractable_ground_water_resource_ham: float | None = None
    total_ground_water_extraction_ham: float | None = None
    stage_of_ground_water_extraction_percent: float | None = None
    categorization: str | None = None
    year: int | None = None

class LLMResponse(BaseModel):
    success: bool
    data: list[DataRecord]
    sql_query: str
    execution_time_ms: int
    rows_returned: int
    cached: bool

def save_llm_response(llm_data: LLMResponse):
    """Save LLM response to JSON file"""
    file_path = Path(__file__).parent.parent / \
                'client/Echarts/insight-weaver-main/insight-weaver-main/src/data/llm-response.json'
    
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(file_path, 'w') as f:
        json.dump(llm_data.dict(), f, indent=2)
    
    print(f"✅ LLM response saved to {file_path}")

@app.post('/api/llm-query')
async def handle_llm_query(request: LLMQueryRequest):
    try:
        # Call your LLM
        llm_response = await call_your_llm(request.query)
        
        # Save to JSON
        save_llm_response(llm_response)
        
        return {
            'success': True,
            'message': 'Charts updated',
            'data': llm_response.dict()
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

async def call_your_llm(query: str) -> LLMResponse:
    """Call your LLM and return response"""
    # ... your LLM call logic ...
    pass
*/

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Direct File Write (Development Testing)
// ═══════════════════════════════════════════════════════════════════════════

/*
# For testing without a backend, directly write to the JSON file

import json
from pathlib import Path

# Define your data
llm_response = {
    "success": True,
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
    "execution_time_ms": 100,
    "rows_returned": 1,
    "cached": False
}

# Write to JSON file
file_path = Path(__file__).parent.parent / \
            'client/Echarts/insight-weaver-main/insight-weaver-main/src/data/llm-response.json'

file_path.parent.mkdir(parents=True, exist_ok=True)

with open(file_path, 'w') as f:
    json.dump(llm_response, f, indent=2)

print(f"✅ Data written to {file_path}")

# Now visit http://localhost:5173/llm-data to see the charts!
*/

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTANT: JSON SCHEMA THAT YOUR LLM MUST FOLLOW
// ═══════════════════════════════════════════════════════════════════════════

const requiredFormat = {
  success: true, // boolean - whether query was successful
  data: [
    {
      // These fields are detected and used for charts
      state: "string", // Geographic location
      district: "string",
      assessment_unit_name: "string",
      assessment_unit_type: "string",
      
      // Numeric fields - automatically become chart series
      recharge_worthy_area_ha: "number (float)",
      total_annual_ground_water_recharge_ham: "number (float)",
      annual_extractable_ground_water_resource_ham: "number (float)",
      total_ground_water_extraction_ham: "number (float)",
      
      // Percentage fields - special handling
      stage_of_ground_water_extraction_percent: "number (float)",
      
      // Category field - pie charts
      categorization: "string (Safe | Semi-Critical | Critical | Over-Exploited)",
      
      // Time field
      year: "number (integer)",
    },
  ],
  sql_query: "string - the SQL query that generated this data",
  execution_time_ms: "number - how long the query took",
  rows_returned: "number - total rows returned",
  cached: "boolean - whether this result was cached",
};

// ═══════════════════════════════════════════════════════════════════════════
// TESTING YOUR INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/*
1. Update the JSON file (via your backend or manually)
2. Visit http://localhost:5173/llm-data
3. Click "Refresh" or wait 5 seconds for auto-refresh
4. Charts appear automatically! ✨

console.log(requiredFormat);
*/
