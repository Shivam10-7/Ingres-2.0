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

    emb_model = os.getenv("OLLAMA_EMBED_MODEL", "mxbai-embed-large")
    print(f"🧠 Creating embeddings using {emb_model}...")
    try:
        embedding = OllamaEmbeddings(
            model=emb_model
        )
    except Exception as e:
        raise RuntimeError(
            f"unable to load Ollama embedding model '{emb_model}': {e}.\n"
            "pull the model with `ollama pull {emb_model}` or set OLLAMA_EMBED_MODEL to an installed name."
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