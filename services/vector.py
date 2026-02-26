# vector.py

import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_PATH = "chroma_db"
PDF_PATH = "data/groundwater.pdf"

def ingest_pdf():
    print("📄 Loading PDF...")
    loader = PyPDFLoader(PDF_PATH)
    documents = loader.load()

    print("✂️ Splitting text...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    chunks = splitter.split_documents(documents)

    print("🧠 Creating embeddings using mxbai-embed-large...")
    embedding = OllamaEmbeddings(
        model="mxbai-embed-large"
    )

    print("💾 Storing in ChromaDB...")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding,
        persist_directory=CHROMA_PATH
    )

    vectorstore.persist()
    print("✅ Ingestion Complete!")

if __name__ == "__main__":
    ingest_pdf()