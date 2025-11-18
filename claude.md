# Taquero Project - Claude Session Handoff Document

**Last Updated:** 2025-11-18
**Current Branch:** `claude/continue-session-01KSUyX6yVetUkyyBJukrTGu`
**Project Status:** Active Development - Allergens & Suppliers modules complete

---

## Project Overview

**Taquero** is a food safety compliance management system designed for New Zealand restaurants and food manufacturers. It helps businesses maintain MPI (Ministry for Primary Industries) Food Control Plan compliance records.

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **State Management:** Zustand with persist middleware
- **UI Components:** shadcn/ui (dark theme)
- **Backend:** Google Apps Script (doGet/doPost pattern)
- **Database:** Google Sheets
- **Deployment:** GitHub Pages via GitHub Actions
- **Styling:** Tailwind CSS

### Repository
- **Owner:** Popyui2
- **Repo:** Taquero
- **Live URL:** https://popyui2.github.io/Taquero/

---

## Current Implementation Status

### ✅ Completed Modules

#### 1. **Allergens in My Food** (`/module/allergens`)
- **Purpose:** Track allergens in dishes to inform customers (MPI requirement)
- **Features:**
  - 3-step wizard: Dish Name → Ingredients → Allergens
  - Multi-select allergen checkboxes grouped by type (Common, Tree Nuts, Shellfish)
  - Expandable table rows showing full details
  - Edit/delete functionality with soft delete (status tracking)
  - Google Sheets integration
- **Files:**
  - `/taquero-react/src/pages/modules/Allergens.tsx` - Main page
  - `/taquero-react/src/components/allergens/AddAllergenWizard.tsx` - 3-step wizard
  - `/taquero-react/src/store/allergensStore.ts` - Zustand store
  - `/taquero-react/src/types/index.ts` - AllergenRecord type
  - `/ALLERGENS_GOOGLE_SCRIPT.js` - Google Apps Script backend
- **Google Sheets URL:** `https://script.google.com/macros/s/AKfycbwmSfN7KKDheU7KVXD3EyYkCApSN_Git6XgnG6yHaX7QENXlHlrvngCzHO582yVE68gHA/exec`

#### 2. **My Trusted Suppliers** (`/module/suppliers`)
- **Purpose:** Track trusted suppliers for food safety and recall purposes
- **Features:**
  - 4-step wizard: Business Info → Contact Info → Schedule → Products
  - Optional fields: siteRegistrationNumber, phone, email
  - **Mutually exclusive scheduling:** Either (orderDays + deliveryDays) OR customArrangement
  - Day checkboxes for order/delivery schedules
  - Custom arrangement textarea for ad-hoc arrangements
  - Expandable table rows with detailed supplier info
  - Edit/delete functionality with soft delete
  - Google Sheets integration
- **Files:**
  - `/taquero-react/src/pages/modules/MySuppliers.tsx` - Main page
  - `/taquero-react/src/components/suppliers/AddSupplierWizard.tsx` - 4-step wizard
  - `/taquero-react/src/store/suppliersStore.ts` - Zustand store
  - `/taquero-react/src/types/index.ts` - SupplierRecord type
  - `/MY_SUPPLIERS_GOOGLE_SCRIPT.js` - Google Apps Script backend
- **Google Sheets URL:** `https://script.google.com/macros/s/AKfycbxBp8M_cohQeaUNZP5R5nQrJ00XcQUfUCSF92_dAFj9ppPGkBE769DuAo-cMMNiGGcY/exec`

### 🚧 Placeholder Modules (Not Yet Implemented)
- Staff Training Records
- Staff Sickness
- Fridge/Chiller Temps
- Cleaning & Closing
- Equipment Maintenance
- Cooking Proteins - Batch
- Proving Reheating Method
- Proving the Cooking Method
- Proving Cooling Method
- Cooling Food - Batch Checks
- Processes & Controls (Manufacturing only)
- Selling to Businesses (Manufacturing only)
- When Something Goes Wrong (Restaurant only)
- Customer Complaints (Restaurant only)

---

## Development Workflow

### Standard Module Implementation Steps

When implementing a new module based on MPI record blank requirements:

#### 1. **Planning Phase**
- Review MPI record blank requirements from user
- Identify required fields (mandatory vs optional)
- Determine wizard steps and validation logic
- Plan data structure (TypeScript interface)

#### 2. **Type Definition**
```typescript
// File: /taquero-react/src/types/index.ts
export interface YourModuleRecord {
  id: string
  // ... your fields
  createdBy: string
  createdAt: string
  updatedAt?: string
  status: 'active' | 'deleted'
}
```

#### 3. **Google Apps Script Backend**
Create `/YOUR_MODULE_GOOGLE_SCRIPT.js`:

```javascript
var SHEET_NAME = 'Your_Module_Records'

function initializeSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    var headers = [
      'Unix Timestamp',
      'Record ID',
      // ... your fields
      'Created By',
      'Created At',
      'Updated At',
      'Status'
    ]
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function doGet(e) {
  try {
    var sheet = initializeSheet()
    var data = sheet.getDataRange().getValues()
    var headers = data[0]
    var rows = data.slice(1)

    // Filter out deleted records
    var records = rows
      .filter(function(row) {
        return row[LAST_COLUMN] !== 'deleted'
      })
      .map(function(row) {
        return {
          id: row[1],
          // ... map your fields
          status: row[LAST_COLUMN] || 'active'
        }
      })

    records.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: records })
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function doPost(e) {
  try {
    var sheet = initializeSheet()
    var data = JSON.parse(e.postData.contents)

    // Check if updating existing record
    var existingRowIndex = -1
    if (data.id) {
      var allData = sheet.getDataRange().getValues()
      for (var i = 1; i < allData.length; i++) {
        if (allData[i][1] === data.id) {
          existingRowIndex = i + 1
          break
        }
      }
    }

    var row = [
      data.unixTimestamp || Math.floor(Date.now() / 1000),
      data.id,
      // ... map your fields
      data.status || 'active'
    ]

    if (existingRowIndex > 0) {
      sheet.getRange(existingRowIndex, 1, 1, row.length).setValues([row])
    } else {
      sheet.appendRow(row)
    }

    // Sort by Unix Timestamp descending
    var lastRow = sheet.getLastRow()
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())
      range.sort([{column: 1, ascending: false}])
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}
```

**Deployment Steps for Google Apps Script:**
1. Create new Google Sheet named "Taquero_YourModule"
2. Extensions > Apps Script
3. Paste script code
4. Save (Ctrl/Cmd + S)
5. Deploy > New deployment
6. Type: "Web app"
7. Execute as: "Me"
8. Who has access: "Anyone"
9. Deploy and copy Web app URL
10. Update store file with the URL

#### 4. **Zustand Store**
Create `/taquero-react/src/store/yourModuleStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { YourModuleRecord } from '@/types'

const GOOGLE_SHEETS_URL = 'YOUR_DEPLOYED_URL_HERE'

export async function saveRecordToGoogleSheets(
  record: YourModuleRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      // ... all your fields
      status: record.status,
      unixTimestamp: Math.floor(new Date(record.createdAt).getTime() / 1000),
    }

    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors' as RequestMode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function deleteRecordFromGoogleSheets(
  record: YourModuleRecord
): Promise<{ success: boolean; error?: string }> {
  // Same as save but with status: 'deleted' and updatedAt: new Date().toISOString()
}

interface YourModuleState {
  records: YourModuleRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: YourModuleRecord) => void
  updateRecord: (recordId: string, updates: Partial<YourModuleRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => YourModuleRecord[]
  getRecordById: (recordId: string) => YourModuleRecord | undefined
}

export const useYourModuleStore = create<YourModuleState>()(
  persist(
    (set, get) => ({
      records: [],
      isLoading: false,
      lastFetchTime: null,
      fetchError: null,

      fetchFromGoogleSheets: async () => {
        set({ isLoading: true, fetchError: null })
        try {
          const response = await fetch(GOOGLE_SHEETS_URL, { method: 'GET' })
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          const result = await response.json()
          if (result.success && result.data) {
            set({
              records: result.data,
              lastFetchTime: new Date().toISOString(),
              fetchError: null,
            })
          }
        } catch (error) {
          set({ fetchError: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          set({ isLoading: false })
        }
      },

      addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),

      updateRecord: (recordId, updates) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, ...updates, updatedAt: new Date().toISOString() }
              : record
          ),
        })),

      deleteRecord: (recordId) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, status: 'deleted' as const, updatedAt: new Date().toISOString() }
              : record
          ),
        })),

      getRecords: () => get().records.filter((record) => record.status !== 'deleted'),

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    { name: 'taquero-your-module' }
  )
)
```

#### 5. **Main Page Component**
Create `/taquero-react/src/pages/modules/YourModule.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Plus, Loader2, YourIcon, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useYourModuleStore, deleteRecordFromGoogleSheets } from '@/store/yourModuleStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { AddYourModuleWizard } from '@/components/yourModule/AddYourModuleWizard'
import { YourModuleRecord } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function YourModule() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useYourModuleStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<YourModuleRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<YourModuleRecord | null>(null)

  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  // Toast helpers, edit/delete handlers, etc.

  // Recent records (last 50)
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Your Module Title</h2>
        <p className="text-muted-foreground text-lg">Description of your module</p>
      </div>

      <Button size="lg" onClick={() => setShowAddWizard(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Add Record
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Records Table</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table with expandable rows */}
        </CardContent>
      </Card>

      <AddYourModuleWizard
        open={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={handleRecordAdded}
        editingRecord={editingRecord}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        {/* Delete confirmation dialog */}
      </AlertDialog>

      <ToastContainer>{/* Toasts */}</ToastContainer>
    </div>
  )
}
```

#### 6. **Wizard Component**
Create `/taquero-react/src/components/yourModule/AddYourModuleWizard.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/authStore'
import { useYourModuleStore, saveRecordToGoogleSheets } from '@/store/yourModuleStore'
import { YourModuleRecord } from '@/types'
import { Loader2 } from 'lucide-react'

export function AddYourModuleWizard({ open, onClose, onSuccess, editingRecord }) {
  const { currentUser } = useAuthStore()
  const { addRecord, updateRecord } = useYourModuleStore()
  const [step, setStep] = useState(1)

  // State variables for each field
  const [field1, setField1] = useState('')
  const [field2, setField2] = useState('')

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord
  const totalSteps = 3 // Adjust based on your wizard
  const progress = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setField1(editingRecord.field1)
      // ... load other fields
    }
  }, [editingRecord, open])

  // Reset form
  const resetForm = () => {
    setStep(1)
    setField1('')
    // ... reset other fields
    setHasPassedStep1(false)
  }

  // Save handler
  const handleSave = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && editingRecord) {
        const updatedRecord: YourModuleRecord = {
          ...editingRecord,
          field1,
          // ... other fields
          updatedAt: new Date().toISOString(),
        }

        await saveRecordToGoogleSheets(updatedRecord)
        updateRecord(editingRecord.id, { field1, /* ... */ })
      } else {
        const recordId = `yourmodule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: YourModuleRecord = {
          id: recordId,
          field1,
          // ... other fields
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        await saveRecordToGoogleSheets(newRecord)
        addRecord(newRecord)
      }

      onSuccess?.()
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error saving record:', error)
      alert('Error saving record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validation
  const canProceedFromStep1 = field1.trim().length > 0
  // ... other step validations

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Progress bar, step content, navigation buttons */}
      </DialogContent>
    </Dialog>
  )
}
```

#### 7. **Add Route**
Update `/taquero-react/src/App.tsx`:

```typescript
import { YourModule } from '@/pages/modules/YourModule'

// In routes:
<Route path="/module/your-module" element={<YourModule />} />
```

#### 8. **Add Module Card**
Update `/taquero-react/src/pages/RestaurantFCP.tsx` and/or `/taquero-react/src/pages/ManufacturingFCP.tsx`:

```typescript
import { YourIcon } from 'lucide-react'

<ModuleCard
  id="your-module"
  title="Your Module Title"
  description="Brief description"
  icon={YourIcon}
  onClick={() => navigate('/module/your-module')}
/>
```

#### 9. **Build and Deploy**
```bash
cd /home/user/Taquero/taquero-react
npm run build
git add .
git commit -m "Implement Your Module with [features]"
git push -u origin claude/continue-session-SESSIONID
```

---

## Key Patterns and Conventions

### Soft Delete Pattern
Always use soft delete (status: 'active' | 'deleted') instead of hard delete:
- Preserves data for audit trails
- Allows recovery if needed
- Filters out deleted records in `getRecords()` and `doGet()`

### Optional Fields
Use TypeScript optional properties with the `|| undefined` pattern:
```typescript
siteRegistrationNumber: siteRegistrationNumber.trim() || undefined
```

### Unix Timestamps
Always include `unixTimestamp` in Google Sheets payloads for proper sorting:
```typescript
unixTimestamp: Math.floor(new Date(record.createdAt).getTime() / 1000)
```

### No-CORS Mode
Always use `mode: 'no-cors'` for POST requests to Google Apps Script:
```typescript
await fetch(GOOGLE_SHEETS_URL, {
  method: 'POST',
  mode: 'no-cors' as RequestMode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
```

### Mutually Exclusive Fields
When fields should be mutually exclusive (like in Suppliers module):
```typescript
// Clear opposite field when this field changes
const handleFieldAChange = (value: string) => {
  if (value.trim().length > 0 && fieldB.length > 0) {
    setFieldB('')
  }
  setFieldA(value)
}
```

### Validation Logic
Use clear, explicit validation for wizard steps:
```typescript
const canProceedFromStep1 = field1.trim().length > 0
const canProceedFromStep2 = field2.trim().length > 0 && field3.trim().length > 0
const canProceedFromStep3 = (arrayField.length > 0) || textField.trim().length > 0
```

### Expandable Table Rows
Use a Set to track expanded row IDs:
```typescript
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

const toggleRowExpanded = (recordId: string) => {
  setExpandedRows((prev) => {
    const newSet = new Set(prev)
    if (newSet.has(recordId)) {
      newSet.delete(recordId)
    } else {
      newSet.add(recordId)
    }
    return newSet
  })
}
```

---

## File Structure

```
Taquero/
├── taquero-react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── allergens/
│   │   │   │   └── AddAllergenWizard.tsx
│   │   │   ├── suppliers/
│   │   │   │   └── AddSupplierWizard.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── ModuleCard.tsx
│   │   │   └── ui/
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       └── toast.tsx
│   │   ├── pages/
│   │   │   ├── modules/
│   │   │   │   ├── Allergens.tsx
│   │   │   │   └── MySuppliers.tsx
│   │   │   ├── RestaurantFCP.tsx
│   │   │   ├── ManufacturingFCP.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── store/
│   │   │   ├── allergensStore.ts
│   │   │   ├── suppliersStore.ts
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── dist/ (build output - gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── ALLERGENS_GOOGLE_SCRIPT.js
├── MY_SUPPLIERS_GOOGLE_SCRIPT.js
├── .github/
│   └── workflows/
│       └── deploy.yml (GitHub Actions deployment)
└── claude.md (this file)
```

---

## Common Tweaks and Modifications

### Making Fields Optional
1. Add `?` to TypeScript interface: `field?: string`
2. Update form labels: `Field Name (optional)`
3. Use `|| undefined` pattern when saving: `field: field.trim() || undefined`
4. Handle null/undefined in display logic

### Adding Custom Arrangement Fields
1. Add textarea input for custom text
2. Create handler that clears related fields
3. Update validation to accept either option
4. Clear custom field when related fields are selected

### Adding Status Tracking
1. Add `status: 'active' | 'deleted'` to interface
2. Add Status column to Google Sheets headers
3. Filter out deleted records in `doGet()`: `row[INDEX] !== 'deleted'`
4. Update delete functions to mark as deleted instead of removing
5. Filter in `getRecords()`: `records.filter((r) => r.status !== 'deleted')`

### Adding Grouped Checkboxes
```typescript
const ALLERGEN_GROUPS = {
  common: ['Item1', 'Item2', 'Item3'],
  treeNuts: ['Item4', 'Item5'],
}

// Render:
{Object.entries(ALLERGEN_GROUPS).map(([groupKey, items]) => (
  <div key={groupKey}>
    <h4>{groupTitle}</h4>
    {items.map((item) => (
      <Checkbox
        key={item}
        checked={selectedItems.includes(item)}
        onCheckedChange={() => toggleItem(item)}
      />
    ))}
  </div>
))}
```

---

## Git Workflow

### Branch Naming
- Format: `claude/continue-session-SESSIONID`
- Always push to this branch
- Example: `claude/continue-session-01KSUyX6yVetUkyyBJukrTGu`

### Commit Messages
Use conventional commit format:
```
Implement Module Name with [key features]

- Feature 1
- Feature 2
- Feature 3
```

### Push Commands
```bash
git add .
git commit -m "Your message"
git push -u origin claude/continue-session-SESSIONID
```

**Important:** Branch must start with `claude/` and end with matching session ID, otherwise push will fail with 403.

### Retries for Network Issues
- For git push failures due to network errors, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
- For git fetch/pull failures, same retry logic

---

## Deployment

### Automatic Deployment
- GitHub Actions automatically deploys to GitHub Pages on push to any branch
- Workflow file: `.github/workflows/deploy.yml`
- Live site updates within 1-2 minutes of push

### Manual Build
```bash
cd /home/user/Taquero/taquero-react
npm run build
```

**Note:** `dist/` folder is gitignored. Don't commit build artifacts.

---

## Important Notes

### Google Sheets Integration
- **Always use no-cors mode** for POST requests
- **Always include unixTimestamp** for proper sorting
- **Always filter deleted records** in doGet()
- **Always sort by createdAt descending** after fetching
- Arrays are stored as comma-separated strings in sheets: `data.orderDays.join(', ')`
- Arrays are parsed when fetching: `row[8].split(',').map(d => d.trim())`

### Zustand Persist
- Store name format: `taquero-module-name`
- Data persists in localStorage
- Survives page refreshes
- Can be cleared via browser DevTools

### TypeScript Strict Mode
- Project uses strict TypeScript
- Handle optional fields explicitly
- Use type assertions sparingly: `as const`, `as RequestMode`

### UI Patterns
- Use shadcn/ui components for consistency
- Dark theme by default
- Mobile-responsive (Tailwind breakpoints: sm, md, lg)
- Expandable rows for detailed views
- Multi-step wizards with progress bars

---

## Troubleshooting

### Build Errors
- Run `npm install` if dependencies missing
- Check TypeScript errors with `npm run build`
- Verify all imports use `@/` alias

### Google Sheets Issues
- Verify Apps Script deployed as "Web app" with "Anyone" access
- Check URL is updated in store file
- Test doGet() by visiting URL in browser
- Check Apps Script logs: Executions tab in Apps Script editor

### State Not Persisting
- Check localStorage in browser DevTools
- Verify store name in persist config
- Clear localStorage and refresh if corrupted

---

## Next Steps

### Pending Modules to Implement
Priority order (based on typical MPI audit requirements):
1. **Staff Training Records** - High priority
2. **Fridge/Chiller Temps** - High priority (daily records)
3. **Cleaning & Closing** - High priority (daily records)
4. **Staff Sickness** - Medium priority
5. **Equipment Maintenance** - Medium priority
6. **Cooking Proteins - Batch** - Medium priority
7. Other modules as needed

### User Feedback Incorporation
- Always ask user for MPI record blank requirements
- Verify field names and validation rules
- Confirm wizard step breakdown
- Test with sample data before marking complete

---

## Contact & Support

For questions about this codebase:
1. Review this claude.md file
2. Check existing module implementations (Allergens, Suppliers)
3. Review MPI requirements for the specific module
4. Ask user for clarification on business logic

---

**End of Handoff Document**
