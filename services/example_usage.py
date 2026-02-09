"""
Example usage of the RAG Chat Application
This script demonstrates how to use the RAGChatApp class programmatically.
"""

from rag_chat import RAGChatApp

# Example 1: Basic usage with default settings
def example_basic():
    """Basic example with default settings"""
    app = RAGChatApp(
        pdf_folder="pdfs",
        model_path="path/to/llama-3.2-1b-instruct-q4_0.gguf"
    )
    
    # Initialize the system
    app.initialize()
    
    # Ask a question
    result = app.chat("What is the main topic of the documents?")
    print(f"\nAnswer: {result['result']}")
    
    # Start interactive chat
    app.interactive_chat()


# Example 2: Custom configuration
def example_custom():
    """Example with custom configuration"""
    app = RAGChatApp(
        pdf_folder="my_documents",
        model_path="models/llama-3.2-3b-instruct-q4_0.gguf",
        persist_directory="custom_db",
        embedding_model="mxbai-embed-large",  # Using Ollama embedding model
        ollama_base_url="http://localhost:11434"  # Default Ollama URL
    )
    
    # Initialize with force reload
    app.initialize(force_reload=True)
    
    # Ask multiple questions
    questions = [
        "Summarize the key points",
        "What are the main conclusions?",
        "List the important dates mentioned"
    ]
    
    for question in questions:
        result = app.chat(question)
        print(f"\nQ: {question}")
        print(f"A: {result['result']}\n")


if __name__ == "__main__":
    # Uncomment the example you want to run
    # example_basic()
    # example_custom()
    
    print("Please uncomment one of the example functions to run it.")
    print("Make sure to update the model_path with your actual model file path.")
