# UI/UX Design Specifications - INGRES

## Design System

### Color Palette
```
Primary: #2563eb (Blue)
Secondary: #10b981 (Green)
Danger: #ef4444 (Red)
Warning: #f59e0b (Amber)
Background: #f9fafb (Light Gray)
Text: #1f2937 (Dark Gray)
Border: #e5e7eb (Light Border)
```

### Typography
- **Heading 1** (H1): 2rem, bold - Page titles
- **Heading 2** (H2): 1.5rem, bold - Section titles
- **Body**: 1rem, regular - Main text
- **Small**: 0.875rem - Helper text, labels
- **Font Family**: System fonts (Segoe UI, -apple-system, etc.)

## Components

### Quick Chat Component

**Location**: `frontend/src/components/QuickChat/QuickChat.tsx`

#### Layout
```
┌─────────────────────────────────────┐
│        INGRES Quick Query           │
└─────────────────────────────────────┘
│                                     │
│  State    [Dropdown ▼]              │
│  District [Dropdown ▼]              │
│  Block    [Dropdown ▼]              │
│  Years    [Multi-select ▼]          │
│                                     │
│     [ Get Data ]  [ Clear ]         │
│                                     │
│  ⏱️ Execution Time: 145ms           │
│                                     │
└─────────────────────────────────────┘
```

#### Component Props
```typescript
interface QuickChatProps {
  onQuerySubmit: (results: QueryResults) => void;
  loading?: boolean;
}
```

#### Dropdown Cascade Rules
1. **State** - Loads all available states from DB
2. **District** - Filters by selected state (disabled until state selected)
3. **Block** - Filters by selected district (disabled until district selected)
4. **Years** - Multi-select, shows available years (2023, 2024)

#### Loading States
- Show spinner when loading dropdown data
- Show "Loading..." text in dropdown
- Disable "Get Data" button during API call
- Show execution time after query completes

#### Error Handling
```
❌ Error
─────────────────────
No data found for the 
selected filters.

[Try Different Filters]
```

### Results Component

**Location**: `frontend/src/components/Results/Results.tsx`

#### Display Format
- **Default**: Table format with scrollable columns
- **Metrics Row**: Highlight key statistics
- **Export**: Option to download as CSV

#### Table Columns
- State
- District
- Block (Assessment Unit)
- Total Annual Recharge (HAM)
- Extractable Resource (HAM)
- Total Extraction (HAM)
- Stage of Extraction (%)
- Categorization (Safe/Semi Critical/Critical/Over Exploited)

#### Responsive Design
- **Desktop (>1024px)**: Full table, side-by-side components
- **Tablet (768-1024px)**: Stacked layout, scrollable table
- **Mobile (<768px)**: Card-based results, full-width dropdowns

## Interactions

### Form Submission
1. User selects all dropdowns
2. Clicks "Get Data" button
3. API call made to `/api/v1/quick-query`
4. Loading spinner shown (max 2 seconds)
5. Results table appears below form
6. Execution time displayed

### Clear Button
- Resets all dropdowns to default state
- Clears results display
- No API call

### Cascade Updates
- When State changes → fetch districts, reset district/block/years
- When District changes → fetch blocks, reset block/years
- When Block changes → reset years
- Dropdowns show "Loading..." while fetching

## Accessibility

### WCAG 2.1 AA Compliance
- ✅ Semantic HTML (`<label>`, `<select>`, `<button>`)
- ✅ ARIA labels for dropdowns
- ✅ Color contrast >= 4.5:1
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ Error messages linked to form fields
- ✅ Loading states announced via `aria-busy`

### Focus Management
- Clear focus indicators (2px outline, primary color)
- Logical tab order: State → District → Block → Years → Buttons
- Focus trap in loading spinner (if modal)

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Initial Load | < 2s | Page render time |
| Dropdown Populate | < 500ms | Per dropdown fetch |
| Query Execution | < 200ms | Backend processing |
| Results Render | < 1s | Table with 100+ rows |

## Mobile First Approach

### Mobile (<768px)
```
Full-width inputs
Stacked dropdowns
Single column layout
Touch-friendly buttons (44px min height)
```

### Tablet (768-1024px)
```
2-column dropdown grid
Side-by-side form/results
Horizontal scrolling tables
```

### Desktop (>1024px)
```
Form + Results side-by-side
Full table display
Hover tooltips on columns
```

## Loading & Error States

### Loading
- Spinner animation (centered)
- "Loading..." text below spinner
- Disabled form inputs
- Estimated time message

### Error States
```
1. Network Error
   "Unable to fetch data. Check your connection."
   [Retry]

2. No Results
   "No data available for selected filters."
   [Try Different Filters]

3. Server Error
   "Server error occurred. Please try again."
   [Contact Support]
```

### Empty State
```
Select filters to query groundwater data.
📊 Quick Chat Mode - No LLM required
⚡ Fast results - < 200ms average
```

## Future Components (Phase 2)

### Complex Query Interface
- Text input for natural language queries
- Language selector (auto-detect or manual)
- LLM response indicator
- Chat history sidebar

### Visualization Component
- ECharts integration
- Bar charts for comparisons
- Maps for geographic data
- Trend lines for time series

## Code Organization

### Component File Structure
```
QuickChat/
├── QuickChat.tsx (main component)
├── QuickChat.css (component styles)
├── hooks/
│   ├── useDropdownCascade.ts
│   └── useQuerySubmit.ts
└── types/
    └── QuickChat.types.ts
```

### CSS Conventions
- Use CSS modules: `QuickChat.module.css`
- Class names: `component__element--modifier`
- Utility classes for common patterns
- Mobile-first media queries

## Accessibility Checklist

Before marking UI complete:
- [ ] All form fields have associated labels
- [ ] Buttons have descriptive text (not just icons)
- [ ] Error messages are linked to fields
- [ ] Color not the only indicator (use icons/text too)
- [ ] Focus visible on all interactive elements
- [ ] Tested with keyboard navigation
- [ ] Loading states announced
- [ ] Images/icons have alt text
- [ ] Contrast ratio >= 4.5:1 (WCAG AA)
- [ ] Responsive design tested on mobile/tablet/desktop
