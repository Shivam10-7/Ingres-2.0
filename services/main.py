"""
RAG Chat Application with Llama3.2 Local LLM
This application allows you to chat with PDF documents stored in a folder.
"""

import os
import sys
from pathlib import Path
from typing import List, Optional

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import LlamaCpp
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler


class RAGChatApp:
    """RAG Chat Application for PDF documents using Llama3.2"""
    
    def __init__(
        self,
        pdf_folder: str = "pdfs",
        model_path: str = None,
        persist_directory: str = "chroma_db",
        embedding_model: str = "mxbai-embed-large",
        ollama_base_url: str = "http://localhost:11434"
    ):
        """
        Initialize the RAG Chat Application
        
        Args:
            pdf_folder: Path to folder containing PDF files
            model_path: Path to Llama3.2 model file (.gguf)
            persist_directory: Directory to persist vector store
            embedding_model: Ollama embedding model name (default: mxbai-embed-large)
            ollama_base_url: Base URL for Ollama API (default: http://localhost:11434)
        """
        self.pdf_folder = Path(pdf_folder)
        self.model_path = model_path
        self.persist_directory = persist_directory
        self.embedding_model = embedding_model
        self.ollama_base_url = ollama_base_url
        
        # Initialize components
        self.embeddings = None
        self.vectorstore = None
        self.llm = None
        self.qa_chain = None
        
        # Create PDF folder if it doesn't exist
        self.pdf_folder.mkdir(exist_ok=True)
        
    def load_embeddings(self):
        """Load the embedding model from Ollama"""
        print(f"Loading embedding model '{self.embedding_model}' from Ollama...")
        print(f"Ollama base URL: {self.ollama_base_url}")
        
        try:
            self.embeddings = OllamaEmbeddings(
                model=self.embedding_model,
                base_url=self.ollama_base_url
            )
            # Test the connection by embedding a small text
            test_embedding = self.embeddings.embed_query("test")
            print(f"Embedding model loaded successfully! (embedding dimension: {len(test_embedding)})")
        except Exception as e:
            print(f"Error loading embedding model: {e}")
            print("\nPlease ensure:")
            print("1. Ollama is installed and running")
            print(f"2. The model '{self.embedding_model}' is pulled in Ollama")
            print("   Run: ollama pull mxbai-embed-large")
            print(f"3. Ollama is accessible at {self.ollama_base_url}")
            raise
        
    def load_pdfs(self) -> List:
        """Load all PDF files from the specified folder"""
        pdf_files = list(self.pdf_folder.glob("*.pdf"))
        
        if not pdf_files:
            print(f"No PDF files found in {self.pdf_folder}")
            return []
        
        print(f"Found {len(pdf_files)} PDF file(s)")
        all_documents = []
        
        for pdf_file in pdf_files:
            print(f"Loading {pdf_file.name}...")
            try:
                loader = PyPDFLoader(str(pdf_file))
                documents = loader.load()
                all_documents.extend(documents)
                print(f"  - Loaded {len(documents)} pages from {pdf_file.name}")
            except Exception as e:
                print(f"  - Error loading {pdf_file.name}: {e}")
        
        return all_documents
    
    def create_vectorstore(self, documents: List, force_reload: bool = False):
        """Create or load vector store from documents"""
        if not documents:
            print("No documents to process!")
            return
        
        # Check if vector store already exists
        if os.path.exists(self.persist_directory) and not force_reload:
            print(f"Loading existing vector store from {self.persist_directory}...")
            try:
                self.vectorstore = Chroma(
                    persist_directory=self.persist_directory,
                    embedding_function=self.embeddings
                )
                print("Vector store loaded successfully!")
                return
            except Exception as e:
                print(f"Error loading vector store: {e}. Creating new one...")
        
        # Create new vector store
        print("Creating vector store...")
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        print("Splitting documents into chunks...")
        chunks = text_splitter.split_documents(documents)
        print(f"Created {len(chunks)} chunks")
        
        # Create vector store
        print("Creating embeddings and storing in vector database...")
        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        print("Vector store created and saved successfully!")
    
    def load_llm(self, n_ctx: int = 4096, n_threads: int = 4, temperature: float = 0.7):
        """Load the Llama3.2 model"""
        if not self.model_path:
            raise ValueError("Model path not specified. Please provide path to Llama3.2 .gguf file.")
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
        
        print(f"Loading Llama3.2 model from {self.model_path}...")
        
        # Callback manager for streaming
        callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
        
        # Initialize LlamaCpp
        self.llm = LlamaCpp(
            model_path=self.model_path,
            n_ctx=n_ctx,
            n_threads=n_threads,
            temperature=temperature,
            callback_manager=callback_manager,
            verbose=False,
        )
        print("Model loaded successfully!")
    
    def create_qa_chain(self):
        """Create the QA chain for RAG"""
        if not self.vectorstore or not self.llm:
            raise ValueError("Vector store and LLM must be initialized first!")
        
        print("Creating QA chain...")
        
        # Custom prompt template
        prompt_template = """Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context: {context}

Question: {question}

Answer: """
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Create retrieval QA chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 3}),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )
        
        print("QA chain created successfully!")
    
    def initialize(self, force_reload: bool = False):
        """Initialize the entire RAG system"""
        print("=" * 60)
        print("Initializing RAG Chat Application")
        print("=" * 60)
        
        # Load embeddings
        self.load_embeddings()
        
        # Load PDFs
        documents = self.load_pdfs()
        
        # Create vector store
        self.create_vectorstore(documents, force_reload)
        
        # Load LLM
        self.load_llm()
        
        # Create QA chain
        self.create_qa_chain()
        
        print("=" * 60)
        print("Initialization complete! Ready to chat.")
        print("=" * 60)
    
    def chat(self, question: str) -> dict:
        """Chat with the PDF documents"""
        if not self.qa_chain:
            raise ValueError("QA chain not initialized. Please call initialize() first.")
        
        print(f"\nQuestion: {question}")
        print("Answer: ", end="")
        
        result = self.qa_chain.invoke({"query": question})
        
        print("\n" + "-" * 60)
        print(f"\nSources: {len(result['source_documents'])} document(s) used")
        
        return result
    
    def interactive_chat(self):
        """Start an interactive chat session"""
        if not self.qa_chain:
            print("Please initialize the system first!")
            return
        
        print("\n" + "=" * 60)
        print("Interactive Chat Session Started")
        print("Type 'quit', 'exit', or 'q' to end the session")
        print("=" * 60 + "\n")
        
        while True:
            question = input("\nYou: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("\nGoodbye!")
                break
            
            if not question:
                continue
            
            try:
                result = self.chat(question)
            except Exception as e:
                print(f"\nError: {e}")


def main():
    """Main function to run the RAG chat application"""
    import argparse
    
    parser = argparse.ArgumentParser(description="RAG Chat Application with Llama3.2")
    parser.add_argument(
        "--model-path",
        type=str,
        required=True,
        help="Path to Llama3.2 model file (.gguf)"
    )
    parser.add_argument(
        "--pdf-folder",
        type=str,
        default="pdfs",
        help="Folder containing PDF files (default: pdfs)"
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default="chroma_db",
        help="Path to persist vector database (default: chroma_db)"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Force reload and recreate vector store"
    )
    parser.add_argument(
        "--embedding-model",
        type=str,
        default="mxbai-embed-large",
        help="Ollama embedding model name (default: mxbai-embed-large)"
    )
    parser.add_argument(
        "--ollama-url",
        type=str,
        default="http://localhost:11434",
        help="Ollama base URL (default: http://localhost:11434)"
    )
    
    args = parser.parse_args()
    
    # Create RAG app instance
    app = RAGChatApp(
        pdf_folder=args.pdf_folder,
        model_path=args.model_path,
        persist_directory=args.db_path,
        embedding_model=args.embedding_model,
        ollama_base_url=args.ollama_url
    )
    
    # Initialize the system
    try:
        app.initialize(force_reload=args.reload)
    except Exception as e:
        print(f"Error during initialization: {e}")
        sys.exit(1)
    
    # Start interactive chat
    app.interactive_chat()


if __name__ == "__main__":
    main()
