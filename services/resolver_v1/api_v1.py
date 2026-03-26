from fastapi import FastAPI
from pydantic import BaseModel

# Import your existing resolver function
from resolver_v1 import extract_intent_and_location

# -------- FastAPI Init --------
app = FastAPI(title="JalSathi API (Resolver Wrapper)")

# -------- Request Schema --------
class QueryRequest(BaseModel):
    query: str

# -------- Routes --------

@app.get("/")
def home():
    return {"message": "JalSathi API running 🚀"}

@app.post("/extract")
def extract(request: QueryRequest):
    try:
        result = extract_intent_and_location(request.query)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }