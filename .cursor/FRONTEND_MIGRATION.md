# Frontend Migration Steps - Detailed Guide

## 🎯 Goal
Move the INGRES frontend from `/Ingres-2.0/frontend/` to a standalone repository.

---

## ✅ Pre-Migration Checklist

- [x] Backend is stable and running independently
- [x] All API endpoints documented
- [x] Environment variables configured
- [x] Git repository initialized for new frontend

---

## 📋 Step-by-Step Migration Process

### **Step 1: Create New Frontend Repository**

```bash
# Option A: New local directory
mkdir Ingres-Frontend
cd Ingres-Frontend

# Option B: Clone from version control (recommended)
git clone <your-repo-url> Ingres-Frontend
cd Ingres-Frontend
```

---

### **Step 2: Copy Frontend Files**

```bash
# From the new Ingres-Frontend directory
cp -r ../Ingres-2.0/frontend/* .

# Should now have:
# - src/
# - public/
# - package.json
# - vite.config.ts
# - tsconfig.json
# - index.html
```

---

### **Step 3: Update Configuration Files**

#### **3a. Create/Update `.env` for Environments**

```bash
# Create .env (development)
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8081/api/v1
EOF

# Create .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://api.yourdomain.com/api/v1
EOF

# Create .env.staging (optional)
cat > .env.staging << 'EOF'
VITE_API_URL=https://staging-api.yourdomain.com/api/v1
EOF
```

#### **3b. Update `vite.config.ts`** (if needed)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For production
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

#### **3c. Update `package.json`**

```json
{
  "name": "ingres-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

---

### **Step 4: Install Dependencies**

```bash
# Remove old node_modules if migrating
rm -rf node_modules package-lock.json

# Fresh install
npm install
npm install --save-dev

# Verify no security vulnerabilities
npm audit
npm audit fix  # if needed
```

---

### **Step 5: Test Locally**

```bash
# Start development server
npm run dev

# Expected output:
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose

# Test in browser
# - Visit http://localhost:5173
# - Check DevTools Console for errors
# - Verify API calls in Network tab
# - Test all dropdowns and queries
```

---

### **Step 6: Build for Production**

```bash
# Build the project
npm run build

# Should create /dist folder with:
# - dist/index.html
# - dist/assets/
# - dist/*.js
# - dist/*.css

# Preview production build locally
npm run preview
# Visit http://localhost:4173
```

---

### **Step 7: Files to Remove/Keep**

#### ✅ Keep These Files
```
src/                    # All source code
public/                 # Static assets  
package.json           # Dependencies
vite.config.ts         # Build config
tsconfig.json          # TypeScript config
index.html             # HTML entry point
.env                   # Environment variables
.gitignore             # Git ignore rules
README.md              # Documentation
```

#### ❌ Remove These (if present)
```
node_modules/          # Will be reinstalled
dist/                  # Build output (generated)
.next/                 # If there's leftover Next.js files
*.log                  # Log files
.DS_Store              # macOS files
```

---

### **Step 8: Set Up Git**

```bash
# Initialize or configure git
git init
git add .
git commit -m "Initial frontend migration from Ingres-2.0"

# Add origin and push
git remote add origin <your-repo>
git branch -M main
git push -u origin main
```

---

### **Step 9: Update Documentation**

Update these files in the new repository:

#### **README.md**
```markdown
# INGRES Frontend

React TypeScript frontend for groundwater data visualization.

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Environment Variables

Create `.env`:
```env
VITE_API_URL=http://localhost:8081/api/v1
```

## Build

```bash
npm run build
```

Output: `dist/` folder

## API Requirements

Requires backend running at the URL specified in VITE_API_URL with endpoints:
- `GET /api/v1/dropdowns/states`
- `GET /api/v1/dropdowns/districts?state=...`
- `GET /api/v1/dropdowns/blocks?state=...&district=...`
- `GET /api/v1/dropdowns/years`
- `GET /api/v1/dropdowns/states-for-district?district=...`
- `GET /api/v1/dropdowns/districts-for-block?block=...`
- `GET /api/v1/dropdowns/states-for-block?block=...`
- `POST /api/v1/quick-query`
```

#### **.gitignore**
```
node_modules/
dist/
build/
.env.local
.env.*.local
*.log
.DS_Store
.vscode/
.idea/
```

---

### **Step 10: CI/CD Pipeline (Optional)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm run build
      - run: npm run type-check
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🚀 Deployment Options After Migration

### **Option 1: Vercel (Easiest)**
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts, set VITE_API_URL in environment variables
```

### **Option 2: Netlify**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### **Option 3: GitHub Pages**
Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/Ingres-Frontend/', // if deploying to subdirectory
  // ...
})
```

### **Option 4: Docker**
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL=http://localhost:8081/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## ✔️ Post-Migration Verification

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server successfully
- [ ] Frontend loads at http://localhost:5173
- [ ] API calls show correct endpoint in Network tab
- [ ] All dropdowns populate with data
- [ ] Queries execute and return results
- [ ] Results display automatically (no manual click needed)
- [ ] Reverse lookups work (select district without state)
- [ ] `npm run build` creates dist/ folder
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No console errors in DevTools

---

## 🔧 Troubleshooting Common Issues

### Issue: CORS Error on API Calls
**Cause**: Backend CORS not configured for new frontend URL
**Fix**: Update backend `.env`:
```env
CORS_ORIGIN=http://localhost:5173  # or production URL
```

### Issue: API_URL Undefined
**Cause**: `.env` file not loaded
**Fix**:
```bash
# Restart dev server after creating .env
npm run dev
```

### Issue: Module Not Found
**Cause**: Dependencies not installed
**Fix**:
```bash
rm -rf node_modules
npm install
npm run dev
```

### Issue: Build Fails
**Cause**: TypeScript compilation errors
**Fix**:
```bash
npm run type-check  # See detailed errors
# Fix reported TypeScript issues
npm run build
```

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Check Network tab in DevTools
3. Verify `.env` configuration
4. Restart dev server
5. Try fresh install: `rm -rf node_modules && npm install`

