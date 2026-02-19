from fastapi import FastAPI 
import ollama

app = FastAPI()

@app.post("/generate")
def generate(prompt: str):
    response = ollama.chat(model="llama3.2",messages =[{"role":"user","content": prompt}])
    return{"response": response["message"]["content"]}

@app.post("/chat")
def generate(prompt: str):
    response = ollama.chat(model="deepseek-r1",messages =[{"role":"admin","content": prompt}])
    return{"response": response["message"]["content"]}