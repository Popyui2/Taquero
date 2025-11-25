# Claude Context - Taquero FCP Management System

**Last Updated:** 2025-11-26
**Current Branch:** main
**Project Owner:** Martin (luiric1998@gmail.com)
**Business:** Hot Like A Mexican - Wellington, NZ

---

## Recent Changes (2025-11-26)

### Major Module Refinements - Pre-Inspection Polish
- **Cooling Batch Checks**: Fixed time display format (ISO datetime → readable 12-hour format with AM/PM)
- **Transport Temp Checks**: Converted from table to accordion layout, updated wizard UI labels
- **When Something Goes Wrong (Incidents)**:
  - Moved button below title with red/destructive variant
  - Converted wizard to modal dialog
  - Redesigned severity selection (vertical stack, colored circles instead of emojis)
  - Converted table to accordion layout
  - Added incident resolution tracking (Mark Follow-up Complete button)
  - Fixed Google Sheets integration with proper column mapping including Incident Status
- **Customer Complaints**:
  - Moved button below title with red/destructive variant
  - Updated description to "Document complaints that customers expressed to you"
  - Converted table to accordion layout matching other modules
  - Added delete confirmation dialog
  - Removed unnecessary color status dots
  - Created complete Google Apps Script from scratch (21 columns)
  - Fixed missing `actionTakenImmediate` field in wizard
  - Added loading state to prevent duplicate submissions
  - Fixed Unix Timestamp placement (now first column in payload)
  - Updated loading text to "Fetching Data"

### Module Consistency Achieved
All critical modules now follow consistent patterns:
- Accordion-style layouts for tablet-friendly viewing
- Edit/Delete buttons in accordion headers
- Red/destructive styling for critical modules
- Buttons positioned below titles
- Proper Google Sheets integration with Unix Timestamp in Column A
- Loading states with "Fetching Data" text

### Git Configuration
- Set git user: Martin <luiric1998@gmail.com>
- Main branch is the source of truth
- Remote branches `claude/*` still exist on GitHub but can be ignored

---

## Project Overview

### What This Is
A **Food Safety Compliance Management System** (PWA) built for Hot Like A Mexican restaurant to manage NZ MPI Food Control Plan (FCP) compliance. Designed for tablet use in commercial kitchen environments.

### Business Context
- **Primary Goal:** Internal use for restaurant compliance (NOT SAAS currently)
- **Target Device:** Android tablets in kitchen
- **Current Status:** Testing phase - owner testing features before staff rollout
- **Critical Need:** FCP compliance modules for daily recordkeeping

### Design Philosophy
- Dark theme optimized for kitchen environments
- Touch-friendly UI (44px minimum tap targets)
- Fast performance on older Android tablets
- Minimalist, task-focused interface
- Offline-capable PWA

---

## Technical Architecture

### Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui (Radix UI primitives) + Tailwind CSS
- **State:** Zustand (20+ stores for different modules)
- **Routing:** React Router v6
- **Backend:** Google Sheets via Apps Script webhooks (no traditional backend)
- **Auth:** Simple password + user selection (not production-grade)

### Project Structure
```
/home/martin/Taquero/taquero-react/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Login & user selection
│   │   ├── dashboard/       # Dashboard cards
│   │   ├── staff-training/  # Staff training components
│   │   └── Layout.tsx
│   ├── pages/
│   │   ├── modules/         # 20+ FCP module pages
│   │   ├── DashboardSelection.tsx
│   │   ├── RestaurantDashboard.tsx
│   │   ├── ManufacturingDashboard.tsx
│   │   ├── RestaurantFCP.tsx
│   │   ├── ManufacturingFCP.tsx
│   │   └── CookingProteinsBatch.tsx
│   ├── store/               # 20+ Zustand stores (one per module)
│   ├── types/               # TypeScript interfaces
│   ├── lib/                 # Utilities (dateUtils, etc.)
│   └── App.tsx
├── docs/                    # Documentation
├── *.js                     # Google Apps Script files
└── *.md                     # Documentation files
```

### Google Sheets Integration
Each module has:
1. A Zustand store managing local state
2. A Google Apps Script webhook URL
3. POST requests to save data to Google Sheets
4. Duplicate prevention logic (date-based)

**Note:** Some modules have incomplete/incorrect backend integration - this is a known issue.

---

## Implemented Modules

### Core Compliance (Shared)
- ✅ **Fridge/Chiller Temps** - Daily temperature monitoring wizard
- ✅ **Staff Training Records** - Training log with MPI-compliant reports
- ✅ **Personal Hygiene (Staff Sickness)** - Sick staff tracking
- ✅ **Cleaning & Closing** - Cleaning schedule checklist
- ✅ **Equipment Maintenance** - Maintenance log

### Cooking & Food Safety
- ✅ **Cooking Proteins - Batch Checks** - Temperature verification for cooked proteins
- ✅ **Proving Time/Temp Cooking** - Method validation (3-batch system)
- ✅ **Proving Cooling Method** - Cooling method validation
- ✅ **Proving Reheating Method** - Reheating method validation
- ✅ **Cooling Food - Batch Checks** - Batch cooling temperature tracking

### Supply Chain & Traceability
- ✅ **Allergens** - Allergen management
- ✅ **My Suppliers** - Supplier database
- ✅ **Supplier Deliveries** - 4-step delivery acceptance wizard
- ✅ **Transport Temp Checks** - Transport temperature monitoring
- ✅ **Trace Your Food** - Product traceability system

### Incidents & Customer Relations
- ✅ **Something Went Wrong** - Incident reporting
- ✅ **Customer Complaints** - Complaint tracking with corrective actions
- ✅ **B2B Sales** - Business-to-business sales tracking

### Placeholder/Incomplete Modules
- ⚠️ **Processes & Controls** - Placeholder
- ⚠️ **Selling to Businesses** - Placeholder
- ⚠️ **Proving the Method** - Placeholder (different from Proving Time/Temp)

---

## Known Issues & Context

### Current State
- **Modules built quickly** - many have UI/UX inconsistencies
- **Backend incomplete** - some Google Sheets integrations incorrect
- **Need polish** - owner wants to refine modules before staff use
- **Testing approach** - going through modules interactively to find and fix issues

### Development Approach
Martin wants to **test and fix together**:
1. Open a module in browser
2. Test functionality
3. Report issues
4. Fix immediately
5. Verify and move to next module

### Areas Needing Attention
- UI/UX consistency across modules
- Complete/correct Google Sheets integration
- Form validation and error handling
- Touch-friendly interactions for tablets
- Data persistence and duplicate prevention
- Loading states and user feedback

---

## Planned Features (Not Implemented)

### High Priority
- Inventory Management (stocktaking, shopping lists)
- Financial Data visualization (CSV intake)
- Caravan Events scheduler

### Future (SAAS Consideration)
- Multi-tenancy architecture
- Proper authentication (OAuth/Firebase)
- Database backend (replace Google Sheets)
- Admin dashboard
- Email notifications
- Advanced reporting/analytics

**Note:** Currently focused on internal restaurant use, NOT building for SAAS.

---

## Development Guidelines

### When Working on This Project

1. **Tablet-First Design**
   - Test on mobile viewport (768px and below)
   - Ensure 44px minimum tap targets
   - Dark theme by default
   - Large, readable fonts

2. **Module Consistency**
   - Each module should follow the same patterns
   - Breadcrumb navigation at top
   - Clear form structure with validation
   - Success/error feedback
   - "Go Back" button in top-left

3. **Google Sheets Integration**
   - Check existing patterns in other modules
   - Include duplicate prevention logic
   - Format dates consistently (NZ timezone)
   - Handle errors gracefully

4. **State Management**
   - One Zustand store per module
   - Store in localStorage for offline capability
   - Clear structure: state, actions, selectors

5. **Component Patterns**
   - Use shadcn/ui components consistently
   - Lucide React icons
   - Follow existing styling patterns
   - TypeScript strict mode

---

## Running the Project

### Development
```bash
cd /home/martin/Taquero/taquero-react
npm install
npm run dev
```
**URL:** http://localhost:5173 (or 5174 if 5173 is in use)

### Build
```bash
npm run build
```
Output in `dist/` directory

### Deploy
```bash
npm run deploy
```
Deploys to GitHub Pages (gh-pages branch)

---

## Testing Credentials

**Password:** 123456
**Users:** Multiple users in authStore.ts

**Note:** This is NOT production-grade security. Only for internal testing.

---

## Important Files

### Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite/build configuration
- `tailwind.config.js` - Tailwind styling
- `tsconfig.json` - TypeScript configuration

### Key Code Files
- `src/App.tsx` - Main routing and authentication logic
- `src/store/authStore.ts` - Authentication state
- `src/components/Layout.tsx` - Main layout wrapper
- `src/types/index.ts` - All TypeScript interfaces

### Documentation
- `README.md` - Project overview (outdated)
- `SETUP.md` - Setup instructions
- `READY_TO_DEPLOY.md` - Deployment guide
- `TEMPERATURE_DEPLOYMENT_INSTRUCTIONS.md` - Google Sheets setup for temp module

### Google Scripts
- Multiple `*_GOOGLE_SCRIPT.js` files for different modules

---

## Next Steps

### Immediate Priority
1. Test modules interactively with Martin
2. Fix UI/UX issues as they're discovered
3. Correct Google Sheets integrations
4. Ensure all modules work reliably on tablets

### Short Term
1. Complete placeholder modules
2. Add comprehensive form validation
3. Improve error handling and user feedback
4. Test on actual Android tablet
5. Staff training and rollout preparation

### Long Term
1. Inventory Management module
2. Financial Data visualization
3. Caravan Events scheduler
4. Consider SAAS expansion

---

## Tips for Future Claude Instances

1. **Check this file first** - it has the most current context
2. **Main branch is truth** - ignore old Claude branches
3. **Test before big changes** - modules are interconnected
4. **Follow existing patterns** - consistency matters for tablet UX
5. **Ask questions** - Martin prefers collaborative, iterative work
6. **Focus on restaurant use case** - not building SAAS yet
7. **Google Sheets is the backend** - work within that constraint
8. **Tablet UX is critical** - always consider touch interactions

---

## Contact

**Owner:** Martin
**Email:** luiric1998@gmail.com
**Business:** Hot Like A Mexican, Wellington, NZ
**GitHub:** Popyui2/Taquero

---

**Remember:** This is a working restaurant's compliance system. Reliability and usability matter more than fancy features. Keep it simple, fast, and tablet-friendly.
