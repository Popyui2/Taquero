// Main Application Logic
const App = {
    currentView: 'dashboard-selection',
    currentDashboard: null, // 'restaurant' or 'manufacturing'
    previousView: null, // For back navigation

    // Initialize the application
    init() {
        this.registerServiceWorker();
        this.setupNavigation();
        this.setupForms();
        this.initializeSheets();
        this.setupBrowserBackButton();
    },

    // Register service worker for PWA
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    },

    // Initialize Google Sheets
    async initializeSheets() {
        try {
            // Uncomment when you have your Google Sheets setup
            // await SheetsAPI.init();
            console.log('Sheets API initialized');
        } catch (error) {
            console.error('Error initializing Sheets API:', error);
        }
    },

    // Setup navigation between views
    setupNavigation() {
        // Dashboard selector clicks
        const dashboardSelectors = document.querySelectorAll('.dashboard-selector');
        dashboardSelectors.forEach(card => {
            card.addEventListener('click', () => {
                const dashboard = card.dataset.dashboard;
                this.selectDashboard(dashboard);
            });
        });

        // Record card clicks
        const recordCards = document.querySelectorAll('.record-card:not(.dashboard-selector)');
        recordCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                if (type) {
                    this.showView(type);
                }
            });
        });

        // Back button clicks (with data-back attribute)
        const backButtons = document.querySelectorAll('.btn-back');
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const backTo = btn.dataset.back;
                if (backTo) {
                    this.showView(backTo);
                } else {
                    this.goBack();
                }
            });
        });

        // Dynamic back buttons (for FCP modules)
        const dynamicBackButtons = document.querySelectorAll('.btn-back-dynamic');
        dynamicBackButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.goBack();
            });
        });

        // Home button click
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.showView('dashboard-selection');
            });
        }

        // Cancel button clicks
        const cancelButtons = document.querySelectorAll('.btn-cancel');
        cancelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.goBack();
            });
        });
    },

    // Setup form submissions
    setupForms() {
        // Temperature form
        const tempForm = document.getElementById('temperature-form');
        if (tempForm) {
            tempForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTemperatureSubmit();
            });
        }
    },

    // Select a dashboard
    selectDashboard(dashboard) {
        this.currentDashboard = dashboard;
        this.showView(`${dashboard}-dashboard`);
    },

    // Go back to previous view
    goBack() {
        if (this.previousView) {
            this.showView(this.previousView);
        } else if (this.currentDashboard) {
            this.showView(`${this.currentDashboard}-dashboard`);
        } else {
            this.showView('dashboard-selection');
        }
    },

    // Show a specific view
    showView(viewName, pushState = true) {
        // Save previous view for back navigation
        this.previousView = this.currentView;

        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));

        // Show requested view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }

        // Update header and home button visibility
        this.updateHeader(viewName);

        // Push state to browser history (for back button support)
        if (pushState) {
            history.pushState({ view: viewName, dashboard: this.currentDashboard }, '', '');
        }
    },

    // Update header based on current view
    updateHeader(viewName) {
        const headerTitle = document.getElementById('header-title');
        const homeBtn = document.getElementById('home-btn');

        if (viewName === 'dashboard-selection') {
            headerTitle.textContent = 'Taquero';
            homeBtn.style.display = 'none';
        } else if (viewName === 'restaurant-dashboard') {
            headerTitle.textContent = 'Restaurant';
            homeBtn.style.display = 'inline-flex';
        } else if (viewName === 'manufacturing-dashboard') {
            headerTitle.textContent = 'Manufacturing';
            homeBtn.style.display = 'inline-flex';
        } else {
            // Inside a module
            headerTitle.textContent = this.currentDashboard === 'restaurant' ? 'Restaurant' : 'Manufacturing';
            homeBtn.style.display = 'inline-flex';
        }
    },

    // Setup browser back button handling
    setupBrowserBackButton() {
        // Push initial state
        history.replaceState({ view: this.currentView, dashboard: this.currentDashboard }, '', '');

        // Listen for browser back/forward button
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.view) {
                // Navigate to the view from history without pushing new state
                this.showView(event.state.view, false);
                this.currentDashboard = event.state.dashboard;
            } else {
                // If no state, go back to dashboard selection
                this.showView('dashboard-selection', false);
            }
        });
    },

    // Handle temperature form submission
    async handleTemperatureSubmit() {
        const formData = {
            type: document.getElementById('temp-type').value,
            location: document.getElementById('temp-location').value,
            temperature: parseFloat(document.getElementById('temp-value').value),
            notes: document.getElementById('temp-notes').value
        };

        // Validate temperature ranges
        if (!this.validateTemperature(formData)) {
            return;
        }

        try {
            showLoading(true);

            // Save to Google Sheets
            // Uncomment when you have your Google Sheets setup:
            // await SheetsAPI.saveTemperatureLog(formData);
            // OR use the simpler method:
            // await SimpleSheetsAPI.saveTemperatureLog(formData);

            // For now, just simulate saving
            await this.simulateSave(formData);

            showLoading(false);
            showToast('Temperature log saved successfully!', 'success');

            // Reset form and go back to dashboard
            document.getElementById('temperature-form').reset();
            this.showView('dashboard');

        } catch (error) {
            showLoading(false);
            showToast('Error saving record: ' + error.message, 'error');
            console.error('Error:', error);
        }
    },

    // Validate temperature readings
    validateTemperature(data) {
        const temp = data.temperature;
        const type = data.type;

        // Validation rules
        const rules = {
            'fridge': { min: -2, max: 8, warning: 'Fridge should be between -2°C and 8°C' },
            'freezer': { min: -25, max: -15, warning: 'Freezer should be between -25°C and -15°C' },
            'hot-holding': { min: 60, max: 100, warning: 'Hot holding should be above 60°C' },
            'cooling': { min: 0, max: 21, warning: 'Cooling should be monitored to reach 21°C quickly' }
        };

        if (rules[type]) {
            const rule = rules[type];
            if (temp < rule.min || temp > rule.max) {
                const confirmMsg = `⚠️ Warning: ${rule.warning}\n\nRecorded: ${temp}°C\n\nDo you want to save this reading anyway?`;
                if (!confirm(confirmMsg)) {
                    return false;
                }
            }
        }

        return true;
    },

    // Simulate saving (remove this when using real Google Sheets)
    simulateSave(data) {
        return new Promise((resolve) => {
            console.log('Saving data:', data);

            // Save to localStorage for demo purposes
            const records = JSON.parse(localStorage.getItem('mpi_temp_records') || '[]');
            records.push({
                timestamp: new Date().toISOString(),
                user: Auth.currentUser.name,
                ...data
            });
            localStorage.setItem('mpi_temp_records', JSON.stringify(records));

            setTimeout(resolve, 1000); // Simulate network delay
        });
    }
};

// Utility Functions

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Format date for display
function formatDate(date) {
    return new Date(date).toLocaleString('en-NZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('App can be installed');

    // You could show a custom install button here
    // For now, browser will show the default install prompt
});

// Track install
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    showToast('App installed successfully!', 'success');
});
