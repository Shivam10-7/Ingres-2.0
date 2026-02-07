# INGRES - Groundwater Data Query System

A natural language interface for the Indian Groundwater Resource (INGRES) database. This system enables users to query groundwater data using structured forms (Quick Chat) and natural language processing.

## 🎯 Project Status

**Phase 1: Quick Chat Feature** - ✅ COMPLETE  
**Phase 2: Data Query Pipeline** - 🔄 IN PROGRESS

---

## 🏗️ Architecture

```
Frontend (React/TS)  →  Node.js API  →  Python FastAPI  →  LLM  →  INGRES DB
```

### Quick Chat Component
- Form-based interface with dropdown cascades (State → District → Block → Years)
- No LLM required - direct SQL generation
- Response time: < 200ms
- 5-minute result caching
- Fully responsive design

### Data Query Pipeline (Coming)
- NLP to SQL conversion
- Multi-language support (Indian languages)
- LLM-powered query intent classification
- RAG pipeline for context-aware results

---

## 📦 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** build tool
- **CSS3** with responsive design
- **Hooks** for state management

### Backend
- **Express.js** REST API
- **TypeScript** for type safety
- **CSV parsing** for data ingestion
- **In-memory caching** (5-minute TTL)

### Data
- **CSV files** (2023, 2024 data)
- **In-memory indexing** (state → districts → blocks)
- **Parameterized queries** (SQL injection prevention)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- CSV data files in `/shared/gdata/`

### Installation

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens http://localhost:5173
```

#### Backend
```bash
cd server
npm install
npm run dev
# Starts http://localhost:3000
```

### Initialize Data
```bash
curl http://localhost:3000/init
```

---

## 📚 Documentation

- **[Quick Chat Implementation Guide](QUICKCHAT_IMPLEMENTATION.md)** - Complete feature overview
- **[Development Rules](.cursor/.cursor/rules/Development.md)** - Workflow guidelines
- **[UI/UX Specifications](.cursor/Docs/UI_UX_doc.md)** - Design system
- **[Project Structure](.cursor/Docs/project_structure.md)** - Folder organization
- **[Implementation Plan](.cursor/Docs/Implementation.md)** - Task tracking

---

## 🔌 API Endpoints

### Dropdown Endpoints
```
GET /api/v1/dropdowns/states
GET /api/v1/dropdowns/districts?state={state}
GET /api/v1/dropdowns/blocks?state={state}&district={district}
GET /api/v1/dropdowns/years
GET /api/v1/dropdowns/all
```

### Query Endpoints
```
POST /api/v1/quick-query
GET /api/v1/quick-query/health
POST /api/v1/quick-query/cache/clear
```

---

## 📊 Data Schema

The system works with groundwater assessment data:

```typescript
interface GroundwaterAssessment {
  state: string;
  district: string;
  assessment_unit_name: string;  // Block
  recharge_worthy_area_ha: number;
  total_annual_ground_water_recharge_ham: number;
  annual_extractable_ground_water_resource_ham: number;
  total_ground_water_extraction_ham: number;
  stage_of_ground_water_extraction_percent: number;
  categorization: "Safe" | "Semi Critical" | "Critical" | "Over Exploited";
  year: number;
}
```

---

## ✨ Features

### ✅ Phase 1: Quick Chat
- [x] Dropdown cascade interface
- [x] Form-based structured queries
- [x] Results table with statistics
- [x] CSV/JSON export
- [x] Responsive design (mobile-friendly)
- [x] Performance optimization (< 200ms queries)
- [x] Query caching (5-minute TTL)
- [x] SQL query transparency
- [x] Error handling and validation
- [x] Accessibility (WCAG 2.1 AA)

### 🔄 Phase 2: Data Query Pipeline
- [ ] NLP query processor
- [ ] LLM integration (Gemini/Ollama)
- [ ] Query intent classifier
- [ ] Multi-language support
- [ ] Chat history
- [ ] Visualization with ECharts
- [ ] RAG pipeline

---

## 🧪 Testing

### Checklist
- [ ] Backend starts on `http://localhost:3000`
- [ ] Frontend starts on `http://localhost:5173`
- [ ] CSV data loads successfully
- [ ] Dropdown cascade works correctly
- [ ] Query executes and returns results
- [ ] Results display in table format
- [ ] Export to CSV/JSON works
- [ ] Responsive design on mobile
- [ ] No console errors
- [ ] Execution time < 200ms (uncached)

### Running Tests
```bash
# Backend
cd server
npm test

# Frontend
cd frontend
npm test
```

---

## 🔐 Security

- ✅ Parameterized SQL queries
- ✅ Input validation (frontend & backend)
- ✅ CORS configuration
- ✅ Type-safe TypeScript
- ✅ Error messages don't leak data
- ✅ No hardcoded secrets

---

## 📁 Project Structure

```
Ingres-2.0/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/            # API & business logic
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript interfaces
│   │   └── App.tsx              # Main component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic
│   │   ├── routes/              # API routes
│   │   ├── types/               # TypeScript interfaces
│   │   └── app.ts               # Express app
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   └── gdata/                   # CSV data files
│       ├── Data2023Final2.csv
│       └── Data2024Final2.csv
│
├── modules/
│   └── quickchat/              # Quick chat module
│
└── docs/                        # Documentation
```

---

## 🛠️ Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use CSS modules for scoped styling
- Write JSDoc comments for functions

### Before Committing
1. Check Development Rules (`.cursor/.cursor/rules/Development.md`)
2. Ensure no console errors
3. Verify responsive design
4. Test all user flows
5. Update documentation

### File Organization
- Types go in `/types/` folder first
- Services before components
- Keep components in feature folders
- Use consistent naming conventions

---

## 🤝 Contributing

1. Read `.cursor/.cursor/rules/Development.md` before starting
2. Check `/cursor/Docs/Implementation.md` for current tasks
3. Follow the established workflow process
4. Document changes in CHANGELOG.md
5. Update relevant documentation

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.

---

## 📞 Support

For issues, questions, or feedback:
1. Check existing documentation
2. Review error messages and logs
3. Check `.cursor/Docs/Bug_tracking.md` for known issues
4. Open an issue with detailed reproduction steps

---

## 📄 License

ISC License - See LICENSE file for details

---

## 🎉 Thank You

Built with ❤️ for groundwater resource management in India.
