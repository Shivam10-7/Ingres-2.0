# INGRES Implementation Plan & Task Tracking

**Last Updated**: February 5, 2026  
**Current Phase**: Phase 1 - Quick Chat Feature  
**Prepared By**: Kushal

---

## 📋 Project Overview

**Goal**: Implement INGRES Data Query Pipeline - A natural language interface for groundwater resource data.

**Responsibilities**: 
1. Quick Chat Feature (Form-based queries) ← **CURRENT FOCUS**
2. Data Query Pipeline (NLP to SQL conversion)

**Key Constraint**: All groundwater data comes from CSV files in `/shared/gdata/`

---

## 🎯 Phase 1: Quick Chat Feature

### Overview
Form-based interface for structured groundwater data queries. No LLM required. Direct SQL generation with dropdown cascading (State → District → Block → Years).

### Key Requirements
- **API Endpoint**: `POST /api/v1/quick-query`
- **Response Time**: < 200ms
- **Cache**: 5-minute result caching
- **Dropdowns**: Cascading (dependent on previous selection)
- **No LLM**: Direct SQL generation

### Phase 1 Tasks

#### ✅ Task 1.1: Define Types & Interfaces
**Status**: `in-progress`  
**Complexity**: Simple  
**Est. Time**: 30 minutes  
**Subtasks**:
- [ ] Create `/frontend/src/types/api.types.ts` - API request/response types
- [ ] Create `/frontend/src/types/query.types.ts` - Query-related types
- [ ] Create `/frontend/src/types/database.types.ts` - Database schema types
- [ ] Create `/server/src/types/index.ts` - Backend types
- [ ] Define `QuickQueryRequest` interface
- [ ] Define `GroundwaterAssessment` interface
- [ ] Define API response wrapper types

**Reference**: `/cursor/AI_AGENT_QUICKREF.md` - Database schema section

---

#### Task 1.2: Build Frontend - Dropdown Data Service
**Status**: `not-started`  
**Complexity**: Medium  
**Est. Time**: 1-2 hours  
**Subtasks**:
- [ ] Create `/frontend/src/services/dropdown.service.ts`
- [ ] Fetch available states from backend
- [ ] Fetch districts by state
- [ ] Fetch blocks by district
- [ ] Implement client-side caching (states: 24hrs, districts: 12hrs)
- [ ] Add error handling and loading states
- [ ] Create hooks: `useDropdownStates()`, `useDropdownDistricts()`, etc.

**API Endpoints Needed**:
```
GET /api/v1/dropdowns/states
GET /api/v1/dropdowns/districts?state={state}
GET /api/v1/dropdowns/blocks?state={state}&district={district}
```

---

#### Task 1.3: Build Frontend - Quick Chat UI Component
**Status**: `not-started`  
**Complexity**: Medium  
**Est. Time**: 2-3 hours  
**Subtasks**:
- [ ] Create `/frontend/src/components/QuickChat/QuickChat.tsx`
- [ ] Create form with 4 dropdowns (State, District, Block, Years)
- [ ] Implement dropdown cascade logic (disable until parent selected)
- [ ] Add "Get Data" and "Clear" buttons
- [ ] Show loading spinner during API call
- [ ] Display execution time after query completes
- [ ] Handle form validation (all fields required)
- [ ] Create `/frontend/src/components/QuickChat/QuickChat.css` with responsive design
- [ ] Add error boundary and error messaging

**Design Reference**: `/cursor/Docs/UI_UX_doc.md` - QuickChat Component section

---

#### Task 1.4: Build Backend - Dropdown Endpoints
**Status**: `not-started`  
**Complexity**: Medium  
**Est. Time**: 2 hours  
**Subtasks**:
- [ ] Create `/server/src/routes/dropdown.routes.ts`
- [ ] Implement `GET /dropdowns/states` endpoint
- [ ] Implement `GET /dropdowns/districts?state={state}` endpoint
- [ ] Implement `GET /dropdowns/blocks?state={state}&district={district}` endpoint
- [ ] Add response caching (5-minute TTL)
- [ ] Add error handling (invalid state/district params)
- [ ] Write data loading logic from CSV files
- [ ] Add response validation middleware

**Data Source**: `/shared/gdata/Data2023Final2.csv` and `/shared/gdata/Data2024Final2.csv`

---

#### Task 1.5: Build Backend - Query Executor Service
**Status**: `not-started`  
**Complexity**: Medium  
**Est. Time**: 2-3 hours  
**Subtasks**:
- [ ] Create `/server/src/services/queryExecutor.service.ts`
- [ ] Implement SQL query builder from form inputs
- [ ] Handle parameterized queries (prevent SQL injection)
- [ ] Implement result filtering by state/district/block/years
- [ ] Add query execution timing
- [ ] Implement 5-minute response caching (key: state+district+block+years)
- [ ] Handle empty results gracefully
- [ ] Add logging for debugging

**Security**: All user inputs must be parameterized in SQL queries

---

#### Task 1.6: Build Backend - Quick Query API Controller
**Status**: `not-started`  
**Complexity**: Medium  
**Est. Time**: 1-2 hours  
**Subtasks**:
- [ ] Create `/server/src/controllers/quickQuery.controller.ts`
- [ ] Implement `POST /api/v1/quick-query` endpoint
- [ ] Validate request body (state, district, block, years required)
- [ ] Call queryExecutor service
- [ ] Format response with metadata (execution_time_ms, sql_query)
- [ ] Add error handling and status codes
- [ ] Add request logging
- [ ] Implement rate limiting (optional for Phase 1)

**Response Format** (from PRD):
```typescript
{
  success: boolean;
  data: GroundwaterAssessment[];
  sql_query: string;
  execution_time_ms: number;
}
```

---

#### Task 1.7: Build Results Display Component
**Status**: `not-started`  
**Complexity**: Medium  
**Est. Time**: 2 hours  
**Subtasks**:
- [ ] Create `/frontend/src/components/Results/Results.tsx`
- [ ] Display results in table format
- [ ] Show key metrics (recharge area, extraction, stage %)
- [ ] Add sorting/filtering on table columns
- [ ] Implement responsive table (mobile: cards, desktop: full table)
- [ ] Show SQL query used (for transparency)
- [ ] Show execution time
- [ ] Add CSV export functionality
- [ ] Highlight critical categorization (Over Exploited) in red

**Design Reference**: `/cursor/Docs/UI_UX_doc.md` - Results Component section

---

#### Task 1.8: Integration & Testing
**Status**: `not-started`  
**Complexity**: Medium  
**Est. Time**: 2-3 hours  
**Subtasks**:
- [ ] Connect QuickChat → Results flow
- [ ] Test dropdown cascading end-to-end
- [ ] Test form validation
- [ ] Test query execution < 200ms performance target
- [ ] Test caching behavior (results should be identical within 5min window)
- [ ] Test error scenarios (no data, network error, invalid input)
- [ ] Test mobile responsiveness
- [ ] Test keyboard navigation (a11y)
- [ ] Test SQL injection prevention
- [ ] Load test with concurrent requests (10+)

---

## 🔄 Phase 2: Data Query Pipeline (Future)

### Overview
NLP to SQL conversion with LLM. Supports natural language queries in all major Indian languages.

### Phase 2 Tasks
- [ ] Task 2.1: Backend - NLP Processor Service
- [ ] Task 2.2: Backend - LLM Service (Gemini API & Ollama support)
- [ ] Task 2.3: Backend - Query Intent Classifier
- [ ] Task 2.4: Frontend - Complex Query Component
- [ ] Task 2.5: Frontend - Chat History UI
- [ ] Task 2.6: Backend - RAG Pipeline (optional)
- [ ] Task 2.7: Testing & Optimization

---

## 📚 Key Documentation References

### Read BEFORE Implementation
1. **`/cursor/Docs/UI_UX_doc.md`** - Design specs and component layouts
2. **`/cursor/Docs/project_structure.md`** - Folder organization and naming rules
3. **`/cursor/AI_AGENT_QUICKREF.md`** - Database schema and API specs
4. **PRD Section 4.1** - Quick Chat Mode detailed requirements

### Database Schema
From `/shared/gdata/`:
- `Data2023Final2.csv` - 2023 groundwater data
- `Data2024Final2.csv` - 2024 groundwater data

**Key Fields**:
- state, district, assessment_unit_name (block)
- recharge_worthy_area_ha
- total_annual_ground_water_recharge_ham
- annual_extractable_ground_water_resource_ham
- total_ground_water_extraction_ham
- stage_of_ground_water_extraction_percent
- categorization (Safe, Semi Critical, Critical, Over Exploited)

---

## 🚀 Getting Started

### Step 1: Environment Setup (Manual - if not done)
```bash
cd d:\ingres\Ingres-2.0
npm install (in frontend and server directories)
```

### Step 2: Start with Task 1.1
Create TypeScript types following the database schema. This unblocks all other tasks.

### Step 3: Parallel Development
Tasks 1.2-1.3 (Frontend) can happen in parallel with Tasks 1.4-1.6 (Backend).

---

## ✅ Completion Criteria

Quick Chat Feature is complete when:
1. ✅ All dropdowns cascade correctly
2. ✅ Query returns results in < 200ms (average)
3. ✅ 5-minute caching works
4. ✅ Responsive design works on mobile/tablet/desktop
5. ✅ Error handling tested
6. ✅ SQL injection prevention verified
7. ✅ Accessibility tested (WCAG 2.1 AA)
8. ✅ No console errors or warnings

---

## 🐛 Known Issues & Solutions

See `/cursor/Docs/Bug_tracking.md` for known issues and solutions.

---

## 📝 Notes

- CSV data loading: Both `Data2023Final2.csv` and `Data2024Final2.csv` must be loaded into memory/database
- Performance: Use indexing on state, district, block for fast filtering
- Caching: Implement time-based cache invalidation (not just LRU)
- Security: Always use parameterized queries, never raw SQL concatenation
