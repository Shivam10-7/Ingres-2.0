from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import get_retriever

model = OllamaLLM(model="llama3.2")
template = """
You are a groundwater research assistant.
Answer the user's question using ONLY the provided context from the PDF.
If the context does not contain the answer, say you don't know.

Context:
{context}

Question:
{question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model


def rag_chat(question: str) -> str:
    """Execute RAG pipeline: retrieve relevant docs from vector store and generate response."""
    retriever = get_retriever()
    docs = retriever.invoke(question)
    context = "\n\n".join(
        [f"[source: {d.metadata.get('file_name','')}, page: {d.metadata.get('page','?')}]\n{d.page_content}" for d in docs]
    )
    result = chain.invoke({"context": context, "question": question})
    return result if isinstance(result, str) else str(result)