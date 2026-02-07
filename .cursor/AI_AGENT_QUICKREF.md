# INGRES PROJECT - AI AGENT QUICK REFERENCE

## YOUR RESPONSIBILITIES (KUSHAL)
1. **Quick Chat Feature** - Form-based query interface
2. **Data Query Pipeline** - NLP to SQL conversion with LLM

## CRITICAL: READ THIS BEFORE ANY CODE

### 1. ARCHITECTURE FIRST
```
Frontend (React/TS) → Node API → Python FastAPI → LLM (Gemini API / Ollama) → INGRES DB
```

### 2. TYPES BEFORE CODE
**Location:** `/types/`

Always define types FIRST in:
- `/types/api.types.ts` - API request/response types
- `/types/query.types.ts` - Query-related types  
- `/types/database.types.ts` - Database models
- `/types/models.py` - Python Pydantic models

### 3. TEST BEFORE FEATURE
**Workflow:**
```bash
1. Write test in /tests/
2. Run: pytest tests/test_name.py (should fail)
3. Implement feature
4. Run test again (should pass)
5. Feature complete ✓
```

### 4. DOCUMENT EVERY CHANGE
**Update these files:**
- `CHANGELOG.md` - What changed
- `.ai/agent_context.yaml` - For other agents
- Inline code comments
- API documentation

## DATABASE SCHEMA (INGRES)

```typescript
interface GroundwaterAssessment {
  state: string;
  district: string;
  assessment_unit_name: string;  // Block name
  recharge_worthy_area_ha: number;
  total_annual_ground_water_recharge_ham: number;
  annual_extractable_ground_water_resource_ham: number;
  total_ground_water_extraction_ham: number;
  stage_of_ground_water_extraction_percent: number;
  categorization: 'Safe' | 'Semi Critical' | 'Critical' | 'Over Exploited';
  year: number;
}
```

## LLM CONFIGURATION

### Dev Mode (Fast Testing)
```python
LLM_MODE=api
API_PROVIDER=gemini
API_KEY=your_key
```

### Prod Mode (Local)
```python
LLM_MODE=local
OLLAMA_MODEL=gemma3:4b-it-qat
DEVICE=cpu  # or cuda
```

**Important:** Code must switch automatically based on config!

## QUERY PIPELINE FLOW

```
User Query (any language)
    ↓
Language Detection & Translation
    ↓
Query Classifier (Flag 0 or 1)
    ↓ (if Flag 0 = INGRES related)
LLM: Generate SQL
    ↓
Execute SQL (parameterized!)
    ↓
Post-process Results
    ↓
Return to User
```

## KEY APIS YOU'LL BUILD

### 1. Quick Query
```
POST /api/v1/query/quick
{
  "state": "Maharashtra",
  "district": "Pune", 
  "block": "Haveli",
  "years": [2023, 2024]
}
```

### 2. Complex Query
```
POST /api/v1/query/complex
{
  "query": "महाराष्ट्र में सबसे ज्यादा extraction कहाँ है?",
  "language": "hi",
  "user_id": "user_123",
  "session_id": "session_456"
}
```

## SECURITY CHECKLIST

- [ ] Use parameterized SQL ALWAYS
- [ ] Sanitize user input for LLM prompts
- [ ] Validate all input types
- [ ] Rate limit APIs
- [ ] No sensitive data in logs

## PERFORMANCE TARGETS

| Operation | Target |
|-----------|--------|
| Quick Query | < 200ms |
| Complex Query (API) | < 2s |
| Complex Query (Local) | < 5s |

## TESTING REQUIREMENTS

- Unit tests: 85%+ coverage
- Integration tests for pipelines
- E2E tests for user flows
- SQL injection prevention tests

## BEFORE ASKING AI FOR HELP

Provide this context:
1. Current types (from /types/)
2. Feature description
3. Test cases
4. Schema information

## CODEBASE AWARENESS

**Check before coding:**
```bash
# What changed recently?
git log --oneline -10

# Any breaking changes?
cat .ai/agent_context.yaml

# What's the current state?
cat CHANGELOG.md
```

## COMMIT MESSAGE FORMAT

```
<type>(<scope>): <subject>

Types: feat, fix, test, docs, refactor, chore
Example: feat(query): add Hindi language support
```

## USEFUL COMMANDS

```bash
# Run tests
pytest tests/
npm test

# Type checking
mypy .
tsc --noEmit

# Linting
pylint src/
eslint src/

# Start services
npm run dev          # Frontend
python -m uvicorn main:app --reload  # Backend
```

## NEED HELP?

1. Read the full PRD: `INGRES_PRD.docx`
2. Check types: `/types/`
3. Look at tests: `/tests/`
4. Review schema: `/schema/`

## REMEMBER

- Architecture > Edge cases
- Types stop hallucinations
- Tests verify features work
- Document everything
- Other agents need to know your changes

---

**Quick Start:** Read full PRD → Define types → Write tests → Code → Test → Document
