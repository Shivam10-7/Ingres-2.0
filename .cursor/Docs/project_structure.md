# INGRES Project Structure Guide

## Folder Organization

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── QuickChat/
│   │   │   ├── QuickChat.tsx
│   │   │   ├── QuickChat.css
│   │   │   └── hooks/
│   │   ├── ComplexQuery/
│   │   ├── Visualization/
│   │   └── Results/
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── query.service.ts
│   │   └── cache.service.ts
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── query.types.ts
│   │   ├── database.types.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useQuery.ts
│   │   └── useDropdown.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Backend Structure
```
server/
├── src/
│   ├── controllers/
│   │   ├── quickQuery.controller.ts
│   │   └── complexQuery.controller.ts
│   ├── routes/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── validation.ts
│   │   ├── pipelines/
│   │   │   ├── db/
│   │   │   │   ├── queryBuilder.ts
│   │   │   │   └── cache.ts
│   │   │   └── nlp/
│   │   │       └── processor.ts
│   │   └── api.routes.ts
│   ├── services/
│   │   ├── database.service.ts
│   │   ├── queryExecutor.service.ts
│   │   └── llm.service.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── database.types.ts
│   ├── config/
│   │   └── database.config.ts
│   └── app.ts
├── package.json
└── tsconfig.json
```

## File Creation Rules

### Before Creating Any File/Folder:
1. ✅ Check if similar file exists in the structure
2. ✅ Verify naming conventions (camelCase for files, PascalCase for components)
3. ✅ Ensure TypeScript interfaces are defined in `/types/` first
4. ✅ Update this document when adding new folders
5. ✅ Follow the layer architecture: Types → Services → Controllers → Routes

## Module Dependencies

### Frontend Layers (Bottom to Top)
```
Types (*.types.ts)
    ↓
Services (*.service.ts)
    ↓
Hooks (use*.ts)
    ↓
Components (*.tsx)
    ↓
App.tsx
```

### Backend Layers (Bottom to Top)
```
Types (*.types.ts)
    ↓
Services (*.service.ts)
    ↓
Pipelines (processing logic)
    ↓
Controllers (*.controller.ts)
    ↓
Routes & Middleware
    ↓
app.ts
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `QuickChat.tsx` |
| Services | camelCase + .service.ts | `queryExecutor.service.ts` |
| Types | *.types.ts | `api.types.ts` |
| Controllers | camelCase + .controller.ts | `quickQuery.controller.ts` |
| Hooks | useXxx | `useQuery.ts` |
| Utilities | camelCase | `formatResults.ts` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |

## Dependency Rules

### ❌ NEVER Import
- Components importing from services (use props/hooks instead)
- Controllers importing UI code
- Circular dependencies between modules

### ✅ ALWAYS Do
- Import types first
- Import services only from controllers/hooks
- Use dependency injection for services
- Keep layers separated

## Environment Setup

### Required Files
- `.env` - Database credentials, API keys
- `.env.example` - Template without secrets
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

### Scripts Location
All build/test/dev scripts must be in `package.json`:
- `dev` - Start development server
- `build` - Production build
- `test` - Run tests
- `lint` - ESLint check

## Database Configuration
- Connection strings in `/server/src/config/database.config.ts`
- Schema migrations in `/server/migrations/` (if needed)
- Sample data in `/shared/gdata/`

## Documentation Reference
- API Routes: Document in route file comments
- Type Definitions: Add JSDoc comments
- Complex Logic: Add inline comments explaining the "why"
