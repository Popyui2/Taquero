// Main Application Logic
const App = {
    currentView: 'dashboard',

    // Initialize the application
    init() {
        this.registerServiceWorker();
        this.setupNavigation();
        this.setupForms();
        this.initializeSheets();
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
        // Record card clicks
        const recordCards = document.querySelectorAll('.record-card');
        recordCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.showView(type);
            });
        });

        // Back button clicks
        const backButtons = document.querySelectorAll('.btn-back');
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.showView('dashboard');
            });
        });

        // Cancel button clicks
        const cancelButtons = document.querySelectorAll('.btn-cancel');
        cancelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.showView('dashboard');
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

    // Show a specific view
    showView(viewName) {
        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));

        // Show requested view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }
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
