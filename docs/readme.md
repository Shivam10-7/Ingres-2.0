┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  React + TypeScript + TailwindCSS + Framer Motion              │
│  - INGRESAssistant (Main Chat Interface)                        │
│  - 16+ Custom Chart Components (ECharts, Recharts)             │
│  - Real-time WebSocket Connection                               │
│  - MapLibre GL JS Integration                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket / REST API
┌────────────────────────▼────────────────────────────────────────┐
│                        Backend Layer                            │
│              Go (Golang) - High Performance                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Chat Service                                             │  │
│  │  - WebSocket Handler                                      │  │
│  │  - Conversational Flow Management                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NLP Service                                              │  │
│  │  - Query Intent Classification (17+ patterns)            │  │
│  │  - Entity Extraction (states, districts, years)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LLM Service (Qwen 2.5 Coder via Ollama)                 │  │
│  │  - Natural Language → SQL Generation                     │  │
│  │  - Zero API Costs (Local LLM)                            │  │
│  │  - 200+ lines of hardcoded logic eliminated              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RAG Service (Retrieval-Augmented Generation)            │  │
│  │  - Hybrid Search (Keyword + Semantic)                    │  │
│  │  - Gemini Embeddings (768 dimensions)                    │  │
│  │  - pgvector Integration                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cache Service (Redis)                                    │  │
│  │  - 60% faster repeat queries                             │  │
│  │  - Persistent caching with AOF                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                       Data Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 16 + pgvector                                 │  │
│  │  - 27,000+ Assessment Records                             │  │
│  │  - Vector Embeddings (768D)                               │  │
│  │  - Full-Text Search (tsvector)                            │  │
│  │  - Multi-Year Data (2021-2025)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redis (Persistent Cache)                                 │  │
│  │  - Query Results Cache                                    │  │
│  │  - Session Management                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘