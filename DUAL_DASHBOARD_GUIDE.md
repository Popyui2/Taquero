# Dual-Dashboard Implementation Guide

## Overview

This guide shows how to extend Taquero to support two separate dashboards:
1. **Restaurant Management Dashboard** - Orders, reservations, inventory, staff
2. **Food Manufacturing Dashboard** - Production, quality control, batching, compliance

You'll leverage the existing authentication and styling system while adding new dashboard views.

---

## Architecture Decision: Single File vs. Multiple Files

### Option A: Keep Single index.html (Recommended for now)
- Simpler to manage
- Leverage existing view switching logic
- Add new views alongside existing ones
- Split JavaScript into logical modules

### Option B: Separate HTML files
- Better organization for large projects
- Cleaner separation of concerns
- More complex routing needed

We'll start with **Option A**.

---

## Step 1: Understand the Existing View Structure

The current app uses a simple view-switching pattern:

```javascript
// In js/app.js
showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => 
        view.classList.remove('active')
    );
    
    // Show requested view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        this.currentView = viewName;
    }
}
```

This means for each view, you need:
1. An HTML div with `id="{name}-view"` and `class="view"`
2. Corresponding JavaScript event handlers
3. Corresponding CSS styling

---

## Step 2: Add Dashboard Selector Screen

After login, users should choose which dashboard to access.

### HTML Addition (in index.html, after login-screen):

```html
<!-- Dashboard Selector Screen -->
<div id="dashboard-selector" class="screen">
    <div class="selector-container">
        <div class="selector-logo">
            <h1>Welcome, <span id="selector-user-name"></span></h1>
            <p>Choose your dashboard</p>
        </div>
        
        <div class="selector-grid">
            <div class="selector-card" data-dashboard="mpi">
                <div class="selector-icon">🌶️</div>
                <h2>MPI Compliance</h2>
                <p>Food safety & temperature logs</p>
            </div>
            
            <div class="selector-card" data-dashboard="restaurant">
                <div class="selector-icon">🍽️</div>
                <h2>Restaurant Mgmt</h2>
                <p>Orders, reservations, inventory</p>
            </div>
            
            <div class="selector-card" data-dashboard="manufacturing">
                <div class="selector-icon">🏭</div>
                <h2>Food Manufacturing</h2>
                <p>Production, quality, batching</p>
            </div>
        </div>
        
        <button id="selector-logout" class="btn-logout">Logout</button>
    </div>
</div>
```

### CSS Addition (in css/styles.css):

```css
/* Dashboard Selector Screen */
#dashboard-selector {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-purple));
    position: relative;
    overflow: hidden;
    display: flex !important;
    align-items: center;
    justify-content: center;
}

#dashboard-selector.active {
    display: flex !important;
}

.selector-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    padding: 3rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    max-width: 900px;
    width: 90%;
    position: relative;
    z-index: 1;
}

.selector-logo {
    text-align: center;
    margin-bottom: 3rem;
}

.selector-logo h1 {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
}

.selector-logo p {
    color: var(--text-secondary);
    font-size: 1rem;
}

.selector-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.selector-card {
    background: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: 2rem;
    border: 2px solid var(--border-light);
    cursor: pointer;
    transition: all var(--transition-base);
    text-align: center;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.selector-card:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
}

.selector-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.selector-card h2 {
    color: var(--text-primary);
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

.selector-card p {
    color: var(--text-tertiary);
    font-size: 0.875rem;
}

#selector-logout {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
    display: block;
}

@media (max-width: 768px) {
    .selector-grid {
        grid-template-columns: 1fr;
    }
    
    .selector-container {
        padding: 2rem;
    }
}
```

### JavaScript Addition (update js/app.js):

```javascript
// Add after App object definition
const DashboardSelector = {
    init() {
        const cards = document.querySelectorAll('.selector-card');
        const logoutBtn = document.getElementById('selector-logout');
        const userNameSpan = document.getElementById('selector-user-name');
        
        // Show user name
        if (userNameSpan && Auth.currentUser) {
            userNameSpan.textContent = Auth.currentUser.name.split(' ')[0];
        }
        
        // Handle card clicks
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const dashboardType = card.dataset.dashboard;
                this.selectDashboard(dashboardType);
            });
        });
        
        // Handle logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Auth.logout();
            });
        }
    },
    
    selectDashboard(type) {
        // Store selection
        localStorage.setItem('current_dashboard', type);
        
        // Show appropriate dashboard
        if (type === 'mpi') {
            App.showDashboard('mpi');
        } else if (type === 'restaurant') {
            RestaurantApp.init();
            RestaurantApp.showDashboard();
        } else if (type === 'manufacturing') {
            ManufacturingApp.init();
            ManufacturingApp.showDashboard();
        }
    }
};

// Update Auth.showApp() to show selector instead
// Modify the existing Auth.showApp() method:
Auth.showApp = function() {
    console.log('Showing app screen...', this.currentUser);
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const selectorScreen = document.getElementById('dashboard-selector');
    
    if (loginScreen) loginScreen.classList.remove('active');
    if (appScreen) appScreen.classList.remove('active');
    if (selectorScreen) selectorScreen.classList.add('active');
    
    // Initialize selector
    DashboardSelector.init();
};
```

---

## Step 3: Create Restaurant Dashboard Module

Create a new file: `js/restaurant-dashboard.js`

```javascript
// Restaurant Management Dashboard
const RestaurantApp = {
    currentView: 'restaurant-dashboard',
    currentUser: null,
    
    init() {
        this.currentUser = Auth.currentUser;
        this.setupNavigation();
        this.setupForms();
    },
    
    setupNavigation() {
        // Restaurant dashboard card clicks
        const cards = document.querySelectorAll('[data-restaurant-view]');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const view = card.dataset.restaurantView;
                this.showView(view);
            });
        });
        
        // Back to dashboard buttons
        const backButtons = document.querySelectorAll('[data-restaurant-back]');
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.showView('dashboard');
            });
        });
        
        // Back to dashboard selector
        const selectorBtn = document.getElementById('restaurant-selector-btn');
        if (selectorBtn) {
            selectorBtn.addEventListener('click', () => {
                this.showDashboardSelector();
            });
        }
    },
    
    showView(viewName) {
        // Hide all restaurant views
        document.querySelectorAll('[data-restaurant-view-container]').forEach(view => 
            view.classList.remove('active')
        );
        
        // Show requested view
        const targetView = document.getElementById(`restaurant-${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }
    },
    
    showDashboard() {
        // Hide MPI and manufacturing apps
        document.getElementById('app-screen').classList.remove('active');
        document.getElementById('manufacturing-app-screen')?.classList.remove('active');
        
        // Show restaurant app
        document.getElementById('restaurant-app-screen').classList.add('active');
        this.showView('dashboard');
    },
    
    showDashboardSelector() {
        document.getElementById('restaurant-app-screen').classList.remove('active');
        document.getElementById('dashboard-selector').classList.add('active');
    },
    
    setupForms() {
        // Wire up restaurant form handlers
        // Add form submission handlers here
    }
};
```

### Add Restaurant App HTML (in index.html):

```html
<!-- Restaurant Management App Screen -->
<div id="restaurant-app-screen" class="screen restaurant-app">
    <!-- Header -->
    <header class="app-header restaurant-header">
        <div class="header-content">
            <h1>Restaurant Management</h1>
            <div class="user-info">
                <span id="restaurant-user-name"></span>
                <button id="restaurant-selector-btn" class="btn-logout" style="background: var(--primary-color);">Back</button>
                <button id="restaurant-logout-btn" class="btn-logout">Logout</button>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <main class="main-content">
        <!-- Restaurant Dashboard View -->
        <div id="restaurant-dashboard-view" class="view active" data-restaurant-view-container>
            <div class="dashboard-grid restaurant-dashboard-grid">
                <div class="record-card" data-restaurant-view="orders">
                    <div class="card-icon">📋</div>
                    <h3>Orders</h3>
                    <p>View and manage orders</p>
                </div>
                
                <div class="record-card" data-restaurant-view="reservations">
                    <div class="card-icon">📅</div>
                    <h3>Reservations</h3>
                    <p>Table bookings & seating</p>
                </div>
                
                <div class="record-card" data-restaurant-view="inventory">
                    <div class="card-icon">📦</div>
                    <h3>Inventory</h3>
                    <p>Stock levels & supplies</p>
                </div>
                
                <div class="record-card" data-restaurant-view="staff-schedule">
                    <div class="card-icon">👥</div>
                    <h3>Staff Schedule</h3>
                    <p>Shifts & availability</p>
                </div>
                
                <div class="record-card" data-restaurant-view="reports">
                    <div class="card-icon">📊</div>
                    <h3>Reports</h3>
                    <p>Sales & analytics</p>
                </div>
            </div>
        </div>
        
        <!-- Orders View -->
        <div id="restaurant-orders-view" class="view" data-restaurant-view-container>
            <div class="form-header">
                <button class="btn-back" data-restaurant-back>← Back</button>
                <h2>Orders</h2>
            </div>
            <p class="coming-soon">Orders management coming soon...</p>
        </div>
        
        <!-- Reservations View -->
        <div id="restaurant-reservations-view" class="view" data-restaurant-view-container>
            <div class="form-header">
                <button class="btn-back" data-restaurant-back>← Back</button>
                <h2>Reservations</h2>
            </div>
            <p class="coming-soon">Reservations management coming soon...</p>
        </div>
        
        <!-- Inventory View -->
        <div id="restaurant-inventory-view" class="view" data-restaurant-view-container>
            <div class="form-header">
                <button class="btn-back" data-restaurant-back>← Back</button>
                <h2>Inventory</h2>
            </div>
            <p class="coming-soon">Inventory management coming soon...</p>
        </div>
        
        <!-- Staff Schedule View -->
        <div id="restaurant-staff-schedule-view" class="view" data-restaurant-view-container>
            <div class="form-header">
                <button class="btn-back" data-restaurant-back>← Back</button>
                <h2>Staff Schedule</h2>
            </div>
            <p class="coming-soon">Staff scheduling coming soon...</p>
        </div>
        
        <!-- Reports View -->
        <div id="restaurant-reports-view" class="view" data-restaurant-view-container>
            <div class="form-header">
                <button class="btn-back" data-restaurant-back>← Back</button>
                <h2>Reports</h2>
            </div>
            <p class="coming-soon">Reports coming soon...</p>
        </div>
    </main>
    
    <!-- Loading Overlay (shared) -->
    <div id="loading-overlay" class="loading-overlay">
        <div class="spinner"></div>
        <p>Loading...</p>
    </div>
    
    <!-- Toast Notifications (shared) -->
    <div id="toast-container" class="toast-container"></div>
</div>
```

### Add Restaurant Dashboard Script to index.html:

At the end of the body, add:
```html
<script src="js/restaurant-dashboard.js"></script>
<script src="js/manufacturing-dashboard.js"></script>
```

---

## Step 4: Create Manufacturing Dashboard Module

Similar to restaurant, create `js/manufacturing-dashboard.js`:

```javascript
// Manufacturing Management Dashboard
const ManufacturingApp = {
    currentView: 'manufacturing-dashboard',
    currentUser: null,
    
    init() {
        this.currentUser = Auth.currentUser;
        this.setupNavigation();
        this.setupForms();
    },
    
    setupNavigation() {
        // Manufacturing dashboard card clicks
        const cards = document.querySelectorAll('[data-manufacturing-view]');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const view = card.dataset.manufacturingView;
                this.showView(view);
            });
        });
        
        // Back to dashboard buttons
        const backButtons = document.querySelectorAll('[data-manufacturing-back]');
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.showView('dashboard');
            });
        });
        
        // Back to dashboard selector
        const selectorBtn = document.getElementById('manufacturing-selector-btn');
        if (selectorBtn) {
            selectorBtn.addEventListener('click', () => {
                this.showDashboardSelector();
            });
        }
    },
    
    showView(viewName) {
        // Hide all manufacturing views
        document.querySelectorAll('[data-manufacturing-view-container]').forEach(view => 
            view.classList.remove('active')
        );
        
        // Show requested view
        const targetView = document.getElementById(`manufacturing-${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }
    },
    
    showDashboard() {
        // Hide other apps
        document.getElementById('app-screen').classList.remove('active');
        document.getElementById('restaurant-app-screen')?.classList.remove('active');
        
        // Show manufacturing app
        document.getElementById('manufacturing-app-screen').classList.add('active');
        this.showView('dashboard');
    },
    
    showDashboardSelector() {
        document.getElementById('manufacturing-app-screen').classList.remove('active');
        document.getElementById('dashboard-selector').classList.add('active');
    },
    
    setupForms() {
        // Wire up manufacturing form handlers
    }
};
```

---

## Step 5: Update Authentication Flow

Modify `js/auth.js` to add logout button listeners for all dashboards:

```javascript
// At the end of auth.js, after logout button setup, add:

document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    
    // Setup logout buttons for all dashboards
    const logoutButtons = document.querySelectorAll('[id$="-logout-btn"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            Auth.logout();
        });
    });
});
```

---

## Step 6: Update App.js for MPI Dashboard

Modify the existing App to work as a dashboard option:

```javascript
// In js/app.js, update the showDashboard method
App.showDashboard = function(type = 'mpi') {
    // Hide other dashboards
    document.getElementById('restaurant-app-screen')?.classList.remove('active');
    document.getElementById('manufacturing-app-screen')?.classList.remove('active');
    document.getElementById('dashboard-selector')?.classList.remove('active');
    
    // Show MPI app
    document.getElementById('app-screen').classList.add('active');
    this.showView('dashboard');
};

// Update showing first time
// Replace the call at the end with:
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    // Don't show dashboard yet - let selector choose
});
```

---

## Step 7: Update Login Flow

Modify `js/auth.js` to show the selector after login instead of the app:

```javascript
// In Auth.showApp(), change the logout handler:
Auth.showApp = function() {
    console.log('Showing app screen...', this.currentUser);
    const loginScreen = document.getElementById('login-screen');
    const selectorScreen = document.getElementById('dashboard-selector');
    
    if (loginScreen) loginScreen.classList.remove('active');
    if (selectorScreen) selectorScreen.classList.add('active');
    
    // Set user name in selector
    const userNameEl = document.getElementById('selector-user-name');
    if (userNameEl && this.currentUser) {
        userNameEl.textContent = this.currentUser.name;
    }
    
    // Initialize selector
    if (typeof DashboardSelector !== 'undefined') {
        DashboardSelector.init();
    }
};
```

---

## Step 8: CSS for Multi-Dashboard

Add to `css/styles.css`:

```css
/* Multi-Dashboard Styling */

/* Restaurant Dashboard */
.restaurant-app .app-header {
    border-bottom-color: #FF6B6B;
}

.restaurant-dashboard-grid .record-card::before {
    background: linear-gradient(90deg, #FF6B6B, #FF8E8E);
}

/* Manufacturing Dashboard */
.manufacturing-app .app-header {
    border-bottom-color: #4ECDC4;
}

.manufacturing-dashboard-grid .record-card::before {
    background: linear-gradient(90deg, #4ECDC4, #7FEDE5);
}

/* Ensure screens are properly hidden/shown */
#restaurant-app-screen,
#manufacturing-app-screen {
    display: none !important;
}

#restaurant-app-screen.active,
#manufacturing-app-screen.active {
    display: block !important;
}

/* Responsive adjustment for selector */
@media (max-width: 768px) {
    .selector-container {
        padding: 1.5rem;
    }
    
    .selector-grid {
        gap: 1rem;
    }
    
    .selector-card {
        padding: 1.5rem;
        min-height: 160px;
    }
}
```

---

## Step 9: Update index.html Script Loading

Update the script loading order at the bottom of `index.html`:

```html
<!-- Base Scripts (shared by all) -->
<script src="js/auth.js"></script>
<script src="js/sheets.js"></script>

<!-- App Scripts -->
<script src="js/app.js"></script>                        <!-- MPI Dashboard -->
<script src="js/restaurant-dashboard.js"></script>       <!-- Restaurant Dashboard -->
<script src="js/manufacturing-dashboard.js"></script>    <!-- Manufacturing Dashboard -->

<!-- Initialize based on localStorage -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        // Auth.init() called from auth.js
        // If user is logged in but no dashboard selected, show selector
        if (Auth.currentUser && !localStorage.getItem('current_dashboard')) {
            Auth.showApp();
        }
    });
</script>
```

---

## Testing the Dual-Dashboard System

### Local Testing

1. Open browser to `http://localhost:8000`
2. Test login with password: `123456`
3. Should see dashboard selector
4. Click on each dashboard option
5. Verify navigation works
6. Test back button to selector
7. Test logout

### Test Checklist

- [ ] Login redirects to selector
- [ ] MPI dashboard loads with 6 cards
- [ ] Restaurant dashboard loads with 5 cards
- [ ] Manufacturing dashboard loads with 5 cards
- [ ] Navigation between dashboards works
- [ ] Back button returns to selector
- [ ] Logout works from each dashboard
- [ ] User name displays correctly
- [ ] Cards are properly styled with icons
- [ ] Forms can be accessed from each dashboard
- [ ] Toast notifications appear correctly
- [ ] Loading overlay shows during async operations
- [ ] Responsive design works on tablet (768px+)
- [ ] PWA still installable

---

## Data Storage Considerations

You can use the same Google Sheets backend for all dashboards:

```javascript
// In js/sheets.js, extend with dashboard-specific sheets:

const SheetsAPI = {
    // ... existing code ...
    
    SHEETS: {
        // MPI Compliance
        temperature: 'Temperature Logs',
        cleaning: 'Cleaning Checklist',
        delivery: 'Delivery Logs',
        incident: 'Incident Reports',
        mpi_staff: 'MPI Staff Records',
        
        // Restaurant
        restaurant_orders: 'Restaurant Orders',
        restaurant_reservations: 'Reservations',
        restaurant_inventory: 'Inventory',
        restaurant_staff: 'Restaurant Staff',
        
        // Manufacturing
        manufacturing_production: 'Production Queue',
        manufacturing_quality: 'Quality Control',
        manufacturing_batch: 'Batch Tracking',
        manufacturing_equipment: 'Equipment Status'
    }
};
```

---

## File Summary

Files to create/modify:

1. `index.html` - Add selector screen + 2 new app screens
2. `js/auth.js` - Update to show selector after login
3. `js/app.js` - Keep existing MPI dashboard, add selector integration
4. `js/restaurant-dashboard.js` - New file
5. `js/manufacturing-dashboard.js` - New file
6. `css/styles.css` - Add selector + multi-dashboard styling

Total new code: ~500-600 lines
Complexity: Low (reuses existing patterns)
Testing time: 1-2 hours

---

## Next Steps

1. Implement forms for each dashboard
2. Connect to Google Sheets for data storage
3. Add reporting/export functionality
4. Implement role-based access control
5. Add user management interface

