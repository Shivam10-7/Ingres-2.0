# rag.py

from langchain_core.prompts import PromptTemplate
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_community.vectorstores import Chroma
from langchain_chroma import Chroma

CHROMA_PATH = "chroma_db"

def rag(user_query: str, sql_result: dict):

    # Load embeddings
    embedding = OllamaEmbeddings(model="mxbai-embed-large")

    # Load vector store
    vectorstore = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(user_query)

    context = "\n\n".join([doc.page_content for doc in docs])

    # Load LLM
    llm = OllamaLLM(model="llama3.2")

    template = """
You are JalSathi AI – a groundwater assessment expert.

STRICT RULES:
- Use ONLY the provided context.
- Do NOT hallucinate.


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

    response = chain.invoke({
        "question": user_query,
        "sql_result": sql_result,
        "context": context
    })

    return response