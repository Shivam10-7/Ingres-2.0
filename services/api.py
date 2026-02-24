from fastapi import FastAPI, Query
from pydantic import BaseModel
import ollama

from rag import rag_chat
from vector import ingest_pdfs_to_chroma

app = FastAPI()


class ChatRequest(BaseModel):
    prompt: str


@app.on_event("startup")
def _startup_ingest():
    # Build the Chroma DB once when the API starts (if not already built).
    ingest_pdfs_to_chroma()


@app.get("/rag-chat")
def rag_chat_get(query: str = Query(..., min_length=1)):
    response = rag_chat(query)
    return {"query": query, "response": response}


@app.post("/rag-chat")
def rag_chat_endpoint(request: ChatRequest):
    """RAG-based chat: retrieves relevant context from vector store and generates response."""
    response = rag_chat(request.prompt)
    return {"response": response}


@app.post("/generate")
def generate(prompt: str):
    response = ollama.chat(model="llama3.2",messages =[{"role":"user","content": prompt}])
    return{"response": response["message"]["content"]}

@app.post("/chat")
def generate(prompt: str):
    response = ollama.chat(model="deepseek-r1",messages =[{"role":"user","content": prompt}])
    return{"response": response["message"]["content"]}

@app.post("/gen")
def generate(prompt: str):
    response = ollama.chat(model ="llama3.2",messages=[{"role":"user" ,"content":prompt}])
    return {"response":response["message"]["content"]}