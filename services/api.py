# api.py

from fastapi import FastAPI
from pydantic import BaseModel
from rag import rag, rag_gemini
import json

app = FastAPI(title="JalSathi RAG API")


class QueryRequest(BaseModel):
    user_query: str
    sql_response: dict


@app.post("/rag-chat")
def ask_jalsathi(request: QueryRequest):

    result = rag(
        user_query=request.user_query,
        sql_result=request.sql_response,
    )

    return {
        "success": True,
        "markdown_json": f"```json\n{result}\n```",
    }


@app.post("/rag-chat-gemini")
def ask_jalsathi_gemini(request: QueryRequest):
    """
    Endpoint that uses the Gemini-backed RAG pipeline.
    """

    result = rag_gemini(
        user_query=request.user_query,
        sql_result=request.sql_response,
    )

    return {
        "success": True,
        "markdown_json": f"```json\n{result}\n```",
    }