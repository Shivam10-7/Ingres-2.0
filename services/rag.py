from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

model = OllamaLLM(model="llama3.2")
template = """
you are a ground water research bot which answers the user query based on the give information 
here are some releveant reviews :{policy}
here are some questions to answer from :{question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model


def rag_chat(question: str) -> str:
    """Execute RAG pipeline: retrieve relevant docs from vector store and generate response."""
    policy_docs = retriever.invoke(question)
    policy = "\n".join([doc.page_content for doc in policy_docs])
    result = chain.invoke({"policy": policy, "question": question})
    return result if isinstance(result, str) else str(result)