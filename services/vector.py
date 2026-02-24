from __future__ import annotations

import hashlib
import shutil
from pathlib import Path
from typing import List, Optional

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader
from langchain_ollama import OllamaEmbeddings

try:
    # LangChain newer versions
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:  # pragma: no cover
    # LangChain older versions
    from langchain.text_splitter import RecursiveCharacterTextSplitter


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = BASE_DIR / "data"
DEFAULT_DB_DIR = BASE_DIR / "chroma_langchain_db"
DEFAULT_COLLECTION_NAME = "pdf_rag"


def get_embedding_function():
    """
    Return the embedding function used for the vector store.

    Example patterns you mentioned:
        from langchain_community.embeddings.ollama import OllamaEmbeddings
        from langchain_community.embeddings.bedrock import BedrockEmbeddings

    This project uses Ollama embeddings.
    """
    return OllamaEmbeddings(model="mxbai-embed-large")


def _db_looks_initialized(db_dir: Path) -> bool:
    # Chroma persistence typically creates a sqlite file (plus extra files/folders).
    return (db_dir / "chroma.sqlite3").exists() or any(db_dir.glob("**/*"))


def _stable_doc_id(source: str, page: int, chunk_index: int, text: str) -> str:
    raw = f"{source}|{page}|{chunk_index}|{text[:200]}".encode("utf-8", errors="ignore")
    return hashlib.md5(raw).hexdigest()


def load_pdf_documents(data_dir: Path) -> List[Document]:
    pdf_paths = sorted(data_dir.glob("*.pdf"))
    if not pdf_paths:
        raise FileNotFoundError(f"No PDF files found in: {data_dir}")

    documents: List[Document] = []
    for pdf_path in pdf_paths:
        loader = PyPDFLoader(str(pdf_path))
        docs = loader.load()
        for d in docs:
            # Ensure we always keep a stable, useful source.
            d.metadata = dict(d.metadata or {})
            d.metadata["source"] = str(pdf_path)
            d.metadata["file_name"] = pdf_path.name
        documents.extend(docs)

    return documents


def get_vector_store(
    *,
    db_dir: Path = DEFAULT_DB_DIR,
    collection_name: str = DEFAULT_COLLECTION_NAME,
) -> Chroma:
    db_dir.mkdir(parents=True, exist_ok=True)
    return Chroma(
        collection_name=collection_name,
        persist_directory=str(db_dir),
        embedding_function=get_embedding_function(),
    )


def ingest_pdfs_to_chroma(
    *,
    data_dir: Path = DEFAULT_DATA_DIR,
    db_dir: Path = DEFAULT_DB_DIR,
    collection_name: str = DEFAULT_COLLECTION_NAME,
    force_rebuild: bool = False,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> Chroma:
    """
    Vectorize PDFs in `data_dir` and persist them into a Chroma DB at `db_dir`.

    - If `force_rebuild=True`, the existing DB directory is deleted and rebuilt.
    - Otherwise, if the DB already looks initialized, ingestion is skipped.
    """
    data_dir = Path(data_dir)
    db_dir = Path(db_dir)

    if force_rebuild and db_dir.exists():
        shutil.rmtree(db_dir)

    if db_dir.exists() and _db_looks_initialized(db_dir) and not force_rebuild:
        return get_vector_store(db_dir=db_dir, collection_name=collection_name)

    docs = load_pdf_documents(data_dir)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(docs)

    ids: List[str] = []
    for i, c in enumerate(chunks):
        page = int(c.metadata.get("page", 0) or 0)
        source = str(c.metadata.get("source", ""))
        ids.append(_stable_doc_id(source, page, i, c.page_content))

    vector_store = get_vector_store(db_dir=db_dir, collection_name=collection_name)
    vector_store.add_documents(documents=chunks, ids=ids)
    return vector_store


_RETRIEVER = None


def get_retriever(
    *,
    data_dir: Path = DEFAULT_DATA_DIR,
    db_dir: Path = DEFAULT_DB_DIR,
    collection_name: str = DEFAULT_COLLECTION_NAME,
    k: int = 4,
):
    """
    Lazy getter for the retriever.

    Ensures the PDFs have been ingested into Chroma before returning the retriever.
    """
    global _RETRIEVER
    if _RETRIEVER is None:
        vector_store = ingest_pdfs_to_chroma(
            data_dir=data_dir,
            db_dir=db_dir,
            collection_name=collection_name,
            force_rebuild=False,
        )
        _RETRIEVER = vector_store.as_retriever(search_kwargs={"k": k})
    return _RETRIEVER