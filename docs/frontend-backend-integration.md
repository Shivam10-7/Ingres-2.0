**Overview**
This guide documents how to test the deployed backend and wire it into the frontend. It also lists the current hardcoded localhost URLs in the client so we can replace them with the deployed Render URL.

**Backend Base URL**
Set your base URL to the deployed backend (example):

```
https://ingres-2-0-0xfe.onrender.com
```

**Quick Endpoint Tests (curl)**
1. Health (basic live check):

```bash
curl -s https://ingres-2-0-0xfe.onrender.com/
```

2. Neon DB health (requires table to exist):

```bash
curl -s https://ingres-2-0-0xfe.onrender.com/health/neon
```

3. Signup:

```bash
curl -s -X POST https://ingres-2-0-0xfe.onrender.com/auth/signup-email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"StrongPass123"}'
```

4. Login (returns token in JSON and sets cookie):

```bash
curl -s -X POST https://ingres-2-0-0xfe.onrender.com/auth/login-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"StrongPass123"}'
```

5. Verify (Bearer token):

```bash
curl -s -X GET https://ingres-2-0-0xfe.onrender.com/auth/verify \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

6. Chat (Bearer token recommended in production):

```bash
curl -s -X POST https://ingres-2-0-0xfe.onrender.com/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"query":"show over exploited blocks in rajasthan","isDetailedResponseNeeded":false,"isVisualizationNeeded":true}'
```

7. Chat history APIs:

```bash
curl -s -X POST https://ingres-2-0-0xfe.onrender.com/api/chats \
  -H "Content-Type: application/json" \
  -d '{"userId":"<mongo_user_id>","chatName":"My Chat"}'
```

**Auth Note: Cookies vs Bearer Tokens**
The server sets an HTTP-only cookie named `jwt` on login (`server/src/routes/middleware/auth.js:27`). The current frontend uses `credentials: "include"` and expects cookies. In production (different domains), cookies with `sameSite=Lax` are often not sent on cross-origin `fetch`, so the simplest reliable approach is:

1. Use the `token` returned by `/auth/login-email`.
2. Store it client-side (memory or local storage).
3. Send it as `Authorization: Bearer <token>` on protected requests (`/chat`, `/auth/verify`).

If you want to keep cookie-based auth, we should update cookie settings to `sameSite: "None"` + `secure: true`, and ensure CORS allows credentials.

**Frontend Integration (what to change)**
Right now, several places are hardcoded to `http://localhost:8081`. For production, they need to point to your Render URL. Recommended pattern:

1. Add a frontend env var (Vite style):

```
VITE_API_BASE_URL=https://ingres-2-0-0xfe.onrender.com
```

2. Update the API base in `client/ingress-ai-landing/src/lib/api.ts:2`:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
```

3. Replace direct `fetch("http://localhost:8081/..." )` calls with `API_BASE_URL` so everything is consistent.

**Known Hardcoded Backend URLs (replace with base URL)**
- `client/ingress-ai-landing/src/lib/api.ts:2`
- `client/ingress-ai-landing/src/components/LoginCard.tsx:54`
- `client/ingress-ai-landing/src/components/ProtectedRoute.tsx:12`
- `client/ingress-ai-landing/src/components/UserProfile.tsx:23`
- `client/ingress-ai-landing/src/components/UserProfile.tsx:42`
- `client/ingress-ai-landing/src/components/LogoutButton.tsx:12`
- `client/ingress-ai-landing/src/pages/Chat.tsx:271`
- `client/ingress-ai-landing/src/pages/Chat.tsx:750`

**CORS Checklist**
When the frontend is deployed, add the frontend origin to the CORS allowlist in `server/node.js:69`. Otherwise browser calls will fail with CORS errors.

**Resolver URL**
The backend uses `ENTITY_RESOLVER_URL` from environment if set (`server/src/routes/Modules/Entity_Resolve.js:6`). For production it should be:

```
ENTITY_RESOLVER_URL=https://ingres-2-0.onrender.com/resolve-entity
```
