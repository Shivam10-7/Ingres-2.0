## INGRES 2.0 – JalSathi RAG API: Setup & Run Guide

### 1. Prerequisites
- **Python**: 3.11 (recommended, to match `myvenv`)
- **Ollama**: Installed and running locally (for embeddings and the Ollama LLM). Make sure the embedding model is pulled (e.g. `ollama pull mxbai-embed-large` or set `OLLAMA_EMBED_MODEL` to a model you have).
- **Google Gemini API key** (for the Gemini RAG endpoint)
- **Git** and **pip**

### 2. Clone the project (if not already)
```bash
git clone <your-repo-url>
cd INGRES2.0/Ingres-2.0/services
```

### 3. Create & activate virtual environment
If you want to recreate the existing `myvenv`:

```bash
c
```

You should see `(myvenv)` in your terminal prompt.

### 4. Install dependencies
From the `services` folder:

```bash
pip install -r requirements.txt
```

This installs:
- **FastAPI**, **uvicorn**
- **LangChain** + community/text splitters
- **ChromaDB**
- **Ollama** client
- **Google GenAI integration (`langchain-google-genai`)**
- **python-dotenv**

### 5. Environment variables
Create a `.env` file in the `services` folder (same level as `api.py`) and set:

```bash
GOOGLE_API_KEY=your_gemini_api_key_here
```

Make sure **Ollama** is running and has the models you use:
- `mxbai-embed-large`
- `llama3.2` (or whatever you configured in `rag.py`)

### 6. Ingest the PDF into Chroma
`vector.py` reads `data/groundwater.pdf`, creates embeddings, and stores them in `chroma_db`.

From the `services` folder (with venv activated):

```bash
python vector.py
```

You should see logs like:
- "📄 Loading PDF..."
- "✂️ Splitting text..."
- "🧠 Creating embeddings using mxbai-embed-large..."
- "✅ Ingestion Complete!"

This only needs to be done again if you change the source PDF or want to rebuild the vector store.

### 7. Start the FastAPI server
From the `services` folder:

```bash
uvicorn api:app --reload
```

By default, the API will run at:
- `http://127.0.0.1:8000`

### 8. Available API endpoints
- **Ollama-based RAG chat**
  - **Method**: `POST`
  - **Path**: `/rag-chat`
  - **Body (JSON)**:
    ```json
    {
      "user_query": "Your question here",
      "sql_response": { "any": "SQL result here" }
    }
    ```

- **Gemini-based RAG chat**
  - **Method**: `POST`
  - **Path**: `/rag-chat-gemini`
  - **Body (JSON)**:
    ```json
    {
      "user_query": "Your question here",
      "sql_response": { "any": "SQL result here" }
    }
    ```

Both endpoints return a response with a JSON string formatted as Markdown for easy rendering on the frontend.

### 9. Interactive API docs
Once the server is running, open in your browser:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

You can test both `/rag-chat` and `/rag-chat-gemini` directly from the Swagger UI.