# 🚀 Quick Start Guide for Developers

**For**: Testing and Running the Quick Chat Feature  
**Time Required**: 5 minutes setup + testing

---

## ⚡ TL;DR - Get Running in 5 Minutes

### Step 1: Backend Setup (Terminal 1)
```bash
cd d:\ingres\Ingres-2.0\server
npm install
npm run dev
# Waits for: "✓ Server listening on port 3000"
```

### Step 2: Initialize Data (Terminal 2)
```bash
curl http://localhost:3000/init
# Should return: {"success": true, "stats": {...}}
```

### Step 3: Frontend Setup (Terminal 3)
```bash
cd d:\ingres\Ingres-2.0\frontend
npm install
npm run dev
# Shows: "➜ Local: http://localhost:5173/"
```

### Step 4: Open Browser
```
http://localhost:5173
```

**Expected**: Form with dropdowns visible ✅

---

## 🧪 Quick Test

### Test Quick Chat Functionality

1. **Select State**
   - Click "State" dropdown
   - Choose any state (e.g., "Maharashtra")
   - ✅ Should populate immediately

2. **Select District**
   - "District" dropdown should now be enabled
   - Choose a district
   - ✅ "Block" dropdown should become enabled

3. **Select Block**
   - Choose a block
   - ✅ "Block" field should be populated

4. **Select Years**
   - Check "2023" and "2024"
   - ✅ Both should be checked

5. **Click "Get Data"**
   - ✅ Button should show "Loading..." with spinner
   - ✅ Results should appear below in 1-2 seconds
   - ✅ Should show execution time (usually < 200ms)

6. **Verify Results**
   - ✅ Table should show data rows
   - ✅ Statistics cards above table
   - ✅ "Download CSV" and "Download JSON" buttons work
   - ✅ SQL query visible in expandable section

7. **Test Caching**
   - Click "Get Data" again
   - ✅ Should be instant (< 50ms) and show "Cached" badge

---

## 🐛 If Something Doesn't Work

### Backend Not Starting?
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <PID> /F

# Try again
npm run dev
```

### CSV Data Not Loading?
```bash
# Verify files exist
dir d:\ingres\Ingres-2.0\shared\gdata\

# Should see:
# Data2023Final2.csv
# Data2024Final2.csv

# If missing, copy them to that location
```

### API Not Responding?
```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

### Frontend Shows Errors?
- Press F12 to open DevTools
- Look at Console tab
- Check Network tab to see API requests
- Verify CORS_ORIGIN in server/.env = "http://localhost:5173"

---

## 📂 File Locations Reference

### Important Files
```
Source Code:
- Frontend components: frontend/src/components/
- Backend services: server/src/services/
- Type definitions: server/src/types/ & frontend/src/types/
- API routes: server/src/routes/

Configuration:
- Frontend: frontend/.env
- Backend: server/.env
- Database: server/src/services/csv-loader.service.ts

Documentation:
- Implementation guide: QUICKCHAT_IMPLEMENTATION.md
- Project structure: .cursor/Docs/project_structure.md
- Design specs: .cursor/Docs/UI_UX_doc.md
- Main README: README.md
```

---

## 🔍 How to Debug

### Check Backend Logs
```bash
# All requests are logged to console
# Look for:
# [timestamp] GET /api/v1/dropdowns/states
# [timestamp] POST /api/v1/quick-query
```

### Check Frontend Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Make a request
4. Click on API request
5. Check Response and Headers

### Check Browser Console
- F12 → Console tab
- Should show no red errors
- Warnings are OK
- Look for fetch/API errors if requests fail

---

## ✨ Key API Endpoints to Test

### Dropdown Endpoints
```bash
# Get all states
curl http://localhost:3000/api/v1/dropdowns/states

# Get districts for a state
curl "http://localhost:3000/api/v1/dropdowns/districts?state=Maharashtra"

# Get blocks for state/district
curl "http://localhost:3000/api/v1/dropdowns/blocks?state=Maharashtra&district=Pune"

# Get available years
curl http://localhost:3000/api/v1/dropdowns/years
```

### Query Endpoint
```bash
# Submit a query
curl -X POST http://localhost:3000/api/v1/quick-query \
  -H "Content-Type: application/json" \
  -d '{
    "state": "Maharashtra",
    "district": "Pune",
    "block": "Haveli",
    "years": [2023, 2024]
  }'
```

---

## 📊 What's in the Data?

### CSV Files
- **2023 Data**: `shared/gdata/Data2023Final2.csv`
- **2024 Data**: `shared/gdata/Data2024Final2.csv`
- **Format**: State, District, Block, Metrics, Categorization

### Example Records
```
Maharashtra, Pune, Haveli, 15000 (recharge), 12000 (extraction), Safe
Andhra Pradesh, Hyderabad, Somwarpet, 20000, 18000, Semi Critical
```

### Fields
- State: Administrative state
- District: District name
- Block: Smallest administrative unit
- Recharge: Groundwater recharge area (hectares)
- Extraction: Actual extraction amount (HAM)
- Categorization: Status (Safe/Semi Critical/Critical/Over Exploited)
- Year: Data year (2023 or 2024)

---

## 🎯 Validation Rules

### Form Validation
- **State**: Required, must be from dropdown
- **District**: Required, must be from dropdown
- **Block**: Required, must be from dropdown
- **Years**: At least one year must be selected

### Query Validation
- All fields must be non-empty strings
- Years must be valid numbers
- Valid state/district/block combination must exist

---

## 💻 Development Commands

### Frontend
```bash
cd frontend

npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run lint         # Run ESLint
npm test             # Run tests (if configured)
```

### Backend
```bash
cd server

npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled code
npm test             # Run tests (if configured)
```

---

## 🔄 Typical Workflow

### First Time Setup
1. `npm install` in both folders
2. Start backend server
3. Call `GET /init` endpoint
4. Start frontend
5. Test in browser

### During Development
1. Make code changes
2. Save file (hot reload should happen)
3. Test in browser
4. Check console for errors
5. Repeat

### Before Committing
1. Test all features work
2. Check console for errors
3. Verify responsive design on mobile
4. Run linter: `npm run lint`
5. Update documentation if needed

---

## 🎓 Code Structure

### Frontend Flow
```
User Input (Form)
    ↓
useDropdownCascade Hook
    ↓
dropdown.service.ts (fetch data)
    ↓
API Client (HTTP request)
    ↓
Results Display Component
```

### Backend Flow
```
HTTP Request
    ↓
Validation Middleware
    ↓
Controller (csv-loader.service.ts)
    ↓
Query Executor (queryExecutor.service.ts)
    ↓
Cache Check
    ↓
JSON Response
```

---

## 📱 Testing Responsive Design

### Firefox DevTools
1. Press F12
2. Click device icon (top-left)
3. Choose device (iPhone 12, iPad, etc.)
4. Verify layout adapts

### Chrome DevTools
1. Press F12
2. Press Ctrl+Shift+M (toggle device mode)
3. Select device from dropdown
4. Verify layout adapts

### Breakpoints to Test
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1024px+

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | Kill process: `taskkill /PID <pid> /F` |
| CORS error in browser | Check `CORS_ORIGIN` in server/.env |
| Dropdown empty | Check CSV files exist in shared/gdata/ |
| Slow queries | Normal - first query loads CSV (~1-2s), cached is fast |
| TypeScript errors | Run `npm install` to ensure all types installed |
| Hot reload not working | Restart dev server |

---

## 🚀 Ready to Go!

You're all set! The feature is ready to:
- ✅ Test manually
- ✅ Review code
- ✅ Make modifications
- ✅ Deploy to production
- ✅ Extend for Phase 2

---

## 📞 Need Help?

1. **Can't start backend?** → Check node/npm versions
2. **Dropdown not loading?** → Check CSV files exist
3. **Query fails?** → Check browser console for errors
4. **Something else?** → Check `.cursor/Docs/Bug_tracking.md`

---

**Happy testing! 🎉**
