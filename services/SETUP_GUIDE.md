# Quick Setup Guide

## Step 1: Install Ollama

1. Download and install Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Start Ollama (it should run automatically after installation)
3. Verify Ollama is running:
   ```bash
   ollama lists
   ```

## Step 2: Pull Embedding Model

Pull the `mxbai-embed-large` model in Ollama:
```bash
ollama pull mxbai-embed-large
```

This will download the embedding model (it may take a few minutes).

## Step 3: Install Python Dependencies

```bash
# Activate virtual environment (if using one)
myvenv\Scripts\activate  # Windows
# or
source myvenv/bin/activate  # Linux/Mac

# Install packages
pip install -r requirements.txt
```

## Step 4: Download Llama3.2 Model

1. Visit [HuggingFace Models](https://huggingface.co/models?search=llama-3.2+gguf)
2. Download a quantized model (recommended: Q4_0 or Q5_0 for balance between quality and speed)
   - Example: `llama-3.2-1b-instruct-q4_0.gguf` (smaller, faster)
   - Example: `llama-3.2-3b-instruct-q4_0.gguf` (larger, better quality)
3. Save the model file in your project directory or note the full path

## Step 5: Add PDF Files

1. Place your PDF files in the `pdfs` folder (created automatically)
2. The application will process all `.pdf` files in this folder

## Step 6: Run the Application

```bash
python rag_chat.py --model-path path/to/your/llama-3.2-model.gguf
```

### Example:
```bash
# If model is in the project root
python rag_chat.py --model-path llama-3.2-1b-instruct-q4_0.gguf

# If model is in a subfolder
python rag_chat.py --model-path models/llama-3.2-1b-instruct-q4_0.gguf

# With custom PDF folder
python rag_chat.py --model-path models/llama-3.2-1b-instruct-q4_0.gguf --pdf-folder my_documents
```

## Step 5: Start Chatting

Once initialized, you can ask questions about your PDFs:
- "What is the main topic?"
- "Summarize the key points"
- "What are the conclusions?"
- Type `quit`, `exit`, or `q` to end the session

## Troubleshooting

### Import Errors
If you get import errors, make sure all dependencies are installed:
```bash
pip install --upgrade -r requirements.txt
```

### Ollama Not Found
- Ensure Ollama is installed and running
- Check if Ollama service is running: `ollama list` should work
- Verify the embedding model is pulled: `ollama pull mxbai-embed-large`
- If Ollama is on a different port, use `--ollama-url http://localhost:PORT`

### Model Loading Issues
- Ensure the model file path is correct
- Check that the model file is in GGUF format
- Verify you have enough RAM (1B model needs ~2GB, 3B needs ~4GB)

### PDF Loading Issues
- Ensure PDFs are not password-protected
- Check that PDFs are not corrupted
- Verify PDFs are in the correct folder

### Performance Tips
- Use quantized models (Q4_0, Q5_0) for better performance
- Reduce `n_ctx` if you have memory issues
- Adjust `n_threads` based on your CPU cores

## First Run

On the first run, the application will:
1. Load all PDFs from the folder
2. Create embeddings (this may take a few minutes)
3. Build the vector store
4. Load the LLM model

Subsequent runs will be faster as the vector store is cached!
