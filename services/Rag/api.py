# api.py

from fastapi import FastAPI
from pydantic import BaseModel
from rag import rag, rag_gemini
import json

app = FastAPI(title="JalSathi RAG API")

# allow cross‑origin requests from frontend during development
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust to your domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    user_query: str
    sql_response: dict


@app.post("/rag-chat")
def ask_jalsathi(request: QueryRequest):
    try:
        result = rag(
            user_query=request.user_query,
            sql_result=request.sql_response,
        )
        return {
            "success": True,
            "markdown_json": f"```json\n{result}\n```",
        }
    except Exception as e:
        # log and return error details
        print("error in /rag-chat:", e)
        return {"success": False, "error": str(e)}


@app.post("/rag-chat-gemini")
def ask_jalsathi_gemini(request: QueryRequest):
    """
    Endpoint that uses the Gemini-backed RAG pipeline.
    """
    try:
        result = rag_gemini(
            user_query=request.user_query,
            sql_result=request.sql_response,
        )
        return {
            "success": True,
            "markdown_json": f"```json\n{result}\n```",
        }
    except Exception as e:
        print("error in /rag-chat-gemini:", e)
        return {"success": False, "error": str(e)}