# rag.py

import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_community.vectorstores import Chroma
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI

CHROMA_PATH = "chroma_db"

# Load environment variables from .env (if present)
load_dotenv()


def rag(user_query: str, sql_result: dict):

    # Load embeddings
    embedding = OllamaEmbeddings(model="mxbai-embed-large")

    # Load vector store
    vectorstore = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding,
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(user_query)

    context = "\n\n".join([doc.page_content for doc in docs])

    # Load LLM
    llm = OllamaLLM(model="llama3.2")

    template = """
You are JalSathi AI – a groundwater assessment expert.
Your are Supposed to help Policymakers, farmers, experts and groundwater analysists .

STRICT RULES:
- Use  the provided context for grounding the response .
- Do NOT hallucinate.
- give short response and  respond as per the returned sql.




User Question:
{question}

SQL Result:
{sql_result}

Context:
{context}

Return ONLY valid JSON:

{{
  "answer": "...",
  "grounded_from_document": true/false,
  "confidence": "high/medium/low"
}}
"""

    prompt = PromptTemplate.from_template(template)

    chain = prompt | llm

    response = chain.invoke(
        {
            "question": user_query,
            "sql_result": sql_result,
            "context": context,
        }
    )

    return response


def rag_gemini(user_query: str, sql_result: dict):
    """
    RAG function using Google Gemini API instead of the local Ollama LLM.

    Requires GOOGLE_API_KEY to be set in the environment for authentication.
    """

    # Load embeddings (reuse existing Ollama embeddings and Chroma DB)
    embedding = OllamaEmbeddings(model="mxbai-embed-large")

    vectorstore = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding,
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(user_query)

    # context = "\n\n".join([doc.page_content for doc in docs])

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
    )

    template = """
you are JalSathi chatbot , a ground water virtual assistant . Respond based on teh user
question and sql result.
draft a proper formatted response in given format 




User Question:
{question}

SQL Result:
{sql_result}

Return ONLY valid JSON:

{{
  "answer": "...",
  "grounded_from_document": true/false,
  "confidence": "high/medium/low"
}}
"""

    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm

    response = chain.invoke(
        {
            "question": user_query,
            "sql_result": sql_result,
            # "context": context,
        }
    )

    return response