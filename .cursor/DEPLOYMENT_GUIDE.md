# INGRES Deployment & Migration Guide

## 📦 Project Structure
```
Ingres-2.0/
├── server/             # Backend API (Node.js + Express + TypeScript)
├── frontend/           # Frontend (React + Vite + TypeScript) - [Current]
├── shared/             # Shared data & resources
│   └── gdata/          # CSV data files
├── modules/            # Shared modules
└── docs/               # Documentation
```

---

## 🚀 How to Migrate Frontend to a Separate Folder

The frontend can be deployed independently from the backend. Here's how:

### Option 1: Move Frontend to Root Level (Recommended)
```bash
# Current structure
Ingres-2.0/
├── server/
├── frontend/
└── ...

# Target structure
Ingres-2.0-Frontend/    ← Standalone frontend repo
├── src/
├── package.json
├── vite.config.ts
└── ...
```

### **Step-by-Step Migration:**

#### 1. **Copy Frontend Files**
```bash
# From project root
cp -r frontend/ /path/to/Ingres-2.0-Frontend/
cd /path/to/Ingres-2.0-Frontend/
```

#### 2. **Update Environment Configuration**
```bash
# Edit or create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:8081/api/v1
# Or for production:
# VITE_API_URL=https://api.yourdomain.com/api/v1
EOF
```

#### 3. **Install Dependencies**
```bash
npm install
```

#### 4. **Run Locally**
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

#### 5. **Build for Production**
```bash
npm run build
# Creates dist/ folder ready for deployment
```

#### 6. **Deploy Static Site**
Copy the `dist/` folder to your hosting provider:
- **Vercel**: `vercel deploy dist/`
- **Netlify**: Drag & drop `dist/` folder
- **AWS S3 + CloudFront**: Upload dist/ to S3
- **GitHub Pages**: Configure build output
- **Traditional Server**: Copy dist/* to web server root

---

## 🔄 API Configuration for Different Deployment Scenarios

### Local Development
```env
VITE_API_URL=http://localhost:8081/api/v1
```

### Production (Separate Domains)
```env
VITE_API_URL=https://api.ingres.yourdomain.com/api/v1
```

### Production (Same Domain)
```env
VITE_API_URL=https://yourdomain.com/api/v1
```

### Docker Deployment
```dockerfile
ARG API_URL=http://localhost:8081/api/v1
ENV VITE_API_URL=$API_URL
RUN npm run build
```

---

## 🐳 Docker Deployment Options

### Frontend Only (Nginx)
```dockerfile
# Ingres-Frontend.Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL=http://api:8081/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Both Services (Docker Compose)
```yaml
version: '3.8'
services:
  api:
    build:
      context: ./server
    ports:
      - "8081:8081"
    environment:
      PORT: 8081
      NODE_ENV: production

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://api:8081/api/v1
    ports:
      - "80:80"
    depends_on:
      - api
```

---

## 📋 Deployment Checklist

- [ ] Backend running and API endpoints accessible
- [ ] `.env` file configured with correct API_URL
- [ ] All dependencies installed (`npm install`)
- [ ] Built successfully (`npm run build`)
- [ ] `dist/` folder created and contains `index.html`
- [ ] No console errors in browser DevTools
- [ ] Network tab shows API calls to correct endpoint
- [ ] All dropdowns and queries working
- [ ] Results displaying correctly

---

## 🔗 API Endpoints Required

Ensure these endpoints are available from your backend:

```
GET  /api/v1/dropdowns/states
GET  /api/v1/dropdowns/districts?state={state}
GET  /api/v1/dropdowns/blocks?state={state}&district={district}
GET  /api/v1/dropdowns/years
GET  /api/v1/dropdowns/states-for-district?district={district}
GET  /api/v1/dropdowns/districts-for-block?block={block}
GET  /api/v1/dropdowns/states-for-block?block={block}
POST /api/v1/quick-query
GET  /api/v1/quick-query/health
```

---

## 🛠️ Troubleshooting

### CORS Errors
**Problem**: `No 'Access-Control-Allow-Origin' header`
**Solution**: Backend `.env` must have:
```env
CORS_ORIGIN=http://localhost:5173  # or your frontend URL
```

### API Not Responding
**Problem**: Frontend shows "Failed to connect to API"
**Solution**: 
- Check `VITE_API_URL` in `.env`
- Ensure backend is running on correct port
- Verify API_URL is accessible from frontend domain
- Check browser Network tab for the actual request

### Build Errors
**Problem**: `ERR! peer dep missing`
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React TypeScript Setup](https://react-typescript-cheatsheet.netlify.app/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

