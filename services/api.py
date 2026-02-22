from fastapi import FastAPI
from pydantic import BaseModel
import ollama

from rag import rag_chat

app = FastAPI()


class ChatRequest(BaseModel):
    prompt: str


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
    response = ollama.chat(model="deepseek-r1",messages =[{"role":"admin","content": prompt}])
    return{"response": response["message"]["content"]}

@app.post("/gen")
def generate(prompt: str):
    response = ollama.chat(model ="llama3.2",messages=[{"role":"user" ,"content":prompt}])
    return {"response":response["message"][" content"]}