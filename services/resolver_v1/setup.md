How to Run

### Step 1:
pip install -r requirements.txt

### Step 2:
uvicorn api_v1:app --reload

### Test

Open:
'''
http://127.0.0.1:8000/docs
'''

### Route:
1. /extract
Sample Input:
{
  "query": "groundwater recharge in nagpur and pune"
}
use : for Intent Extraction and Location classification 

2. / 
use :health status

{
  status: 'resolved',
  entities: [ { type: 'district', district: 'Pune', state: 'MAHARASHTRA' } ],
  action: 'ok',
  intent: 'resolve_location',
  description: 'Resolved 1 location(s) from your query.'
}