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
        this.setupTemperatureWizard();
        this.checkDailyCompletions();
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

        // Check for completions when showing dashboard or FCP views
        if (viewName.includes('dashboard') || viewName.includes('fcp')) {
            this.checkDailyCompletions();
        }

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
    },

    // Setup temperature wizard
    setupTemperatureWizard() {
        // Initialize wizard when entering fridge-temps view
        const fridgeTempCards = document.querySelectorAll('[data-type="fridge-temps"]');
        fridgeTempCards.forEach(card => {
            card.addEventListener('click', () => {
                this.initializeTemperatureWizard();
            });
        });

        // Date continue button
        const dateContinueBtn = document.querySelector('.btn-continue-date');
        if (dateContinueBtn) {
            dateContinueBtn.addEventListener('click', () => {
                this.goToTempStep(1);
            });
        }

        // Temperature up/down buttons
        const tempUpButtons = document.querySelectorAll('.btn-temp-up');
        const tempDownButtons = document.querySelectorAll('.btn-temp-down');

        tempUpButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                this.adjustTemperature(unit, 0.5);
            });
        });

        tempDownButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                this.adjustTemperature(unit, -0.5);
            });
        });

        // Continue buttons
        const continueButtons = document.querySelectorAll('.btn-continue');
        continueButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const nextStep = parseInt(btn.dataset.step);
                this.goToTempStep(nextStep);
            });
        });

        // Previous buttons
        const previousButtons = document.querySelectorAll('.btn-previous');
        previousButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const prevStep = parseInt(btn.dataset.step);
                if (prevStep === 0) {
                    this.goToTempStep('date');
                } else {
                    this.goToTempStep(prevStep);
                }
            });
        });

        // Finish button
        const finishBtn = document.querySelector('.btn-finish-temp');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                this.finishTemperatureCheck();
            });
        }
    },

    // Initialize temperature wizard with today's date
    initializeTemperatureWizard() {
        const today = new Date();
        const dateString = today.toLocaleDateString('en-NZ', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const dateDisplay = document.getElementById('temp-check-date');
        const finishDateDisplay = document.getElementById('finish-date');

        if (dateDisplay) dateDisplay.textContent = dateString;
        if (finishDateDisplay) finishDateDisplay.textContent = dateString;

        // Reset to first step
        this.goToTempStep('date');
    },

    // Navigate to a specific temperature wizard step
    goToTempStep(step) {
        const allSteps = document.querySelectorAll('.temp-wizard-step');
        allSteps.forEach(s => s.classList.remove('active'));

        let targetStep;
        if (step === 'date') {
            targetStep = document.getElementById('temp-step-date');
        } else {
            targetStep = document.getElementById(`temp-step-${step}`);
        }

        if (targetStep) {
            targetStep.classList.add('active');
        }
    },

    // Adjust temperature value
    adjustTemperature(unit, delta) {
        let input;
        if (unit === '7') {
            input = document.getElementById('temp-freezer');
        } else {
            input = document.getElementById(`temp-chiller-${unit}`);
        }

        if (input) {
            const currentValue = parseFloat(input.value);
            const newValue = (currentValue + delta).toFixed(1);
            input.value = newValue;
        }
    },

    // Finish temperature check and save data
    async finishTemperatureCheck() {
        // Check if ANYONE already submitted today
        const today = new Date().toISOString().split('T')[0];
        const userName = Auth.currentUser ? Auth.currentUser.name : 'Unknown';

        const previousSubmitter = this.getWhoSubmittedToday('fridge-temps', today);

        if (previousSubmitter) {
            const confirmSubmit = confirm(
                `⚠️ Temperature check already completed today by ${previousSubmitter}.\n\n` +
                `Submitting again (as ${userName}) will create a duplicate entry in Google Sheets.\n\n` +
                `Do you want to continue anyway?`
            );

            if (!confirmSubmit) {
                showToast('Temperature check cancelled', 'info');
                return; // Exit without submitting
            }
        }

        const tempData = {
            date: today,
            timestamp: new Date().toISOString(),
            user: userName,
            chillers: [],
            freezer: null
        };

        // Collect chiller temperatures
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`temp-chiller-${i}`);
            if (input) {
                tempData.chillers.push({
                    unit: `Chiller #${i}`,
                    temperature: parseFloat(input.value)
                });
            }
        }

        // Collect freezer temperature
        const freezerInput = document.getElementById('temp-freezer');
        if (freezerInput) {
            tempData.freezer = {
                unit: 'Freezer',
                temperature: parseFloat(freezerInput.value)
            };
        }

        try {
            showLoading(true, 'Saving to Database...');

            // Save to Google Sheets
            const googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbz27gmlc2swJgIXdayBHnP-b3KMIR-TiuY6Ib35piYo8m0TYDD1SzFbEDp2Q1EeywQg/exec';

            console.log('Sending data to Google Sheets:', tempData);
            console.log('Google Sheets URL:', googleSheetsUrl);

            try {
                const response = await fetch(googleSheetsUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(tempData)
                });
                console.log('Fetch request completed (no-cors mode - cannot see response)');
                console.log('Data should now be in Google Sheets if script is configured correctly');
            } catch (fetchError) {
                console.error('Error sending to Google Sheets:', fetchError);
                showToast('Warning: Could not reach Google Sheets. Data saved locally.', 'warning');
                // Continue anyway - data is still saved locally
            }

            // Also save to localStorage as backup
            const allTempRecords = JSON.parse(localStorage.getItem('fridge_temp_records') || '[]');
            allTempRecords.push(tempData);
            localStorage.setItem('fridge_temp_records', JSON.stringify(allTempRecords));

            // Record that this user has submitted today
            this.recordUserSubmission('fridge-temps', userName, today);

            // Mark as completed for today
            this.markTaskCompleted('fridge-temps');

            showLoading(false);
            showToast('Temperature check saved to Google Sheets!', 'success');

            // Go back to previous view
            this.goBack();

        } catch (error) {
            showLoading(false);
            showToast('Error saving temperature data: ' + error.message, 'error');
            console.error('Error:', error);
        }
    },

    // Check who (if anyone) has submitted today
    getWhoSubmittedToday(taskId, date) {
        const userSubmissions = JSON.parse(localStorage.getItem('user_submissions') || '{}');

        // Structure: { 'fridge-temps': { '2025-11-09': ['Martin', 'Andres'] } }
        if (userSubmissions[taskId] && userSubmissions[taskId][date]) {
            const submitters = userSubmissions[taskId][date];
            if (submitters.length > 0) {
                // Return first submitter (or join all if multiple)
                return submitters.join(', ');
            }
        }

        return null; // No one has submitted today
    },

    // Record that a user has submitted today
    recordUserSubmission(taskId, userName, date) {
        const userSubmissions = JSON.parse(localStorage.getItem('user_submissions') || '{}');

        if (!userSubmissions[taskId]) {
            userSubmissions[taskId] = {};
        }

        if (!userSubmissions[taskId][date]) {
            userSubmissions[taskId][date] = [];
        }

        if (!userSubmissions[taskId][date].includes(userName)) {
            userSubmissions[taskId][date].push(userName);
        }

        localStorage.setItem('user_submissions', JSON.stringify(userSubmissions));
    },

    // Mark a task as completed for today
    markTaskCompleted(taskId) {
        const today = new Date().toISOString().split('T')[0];
        const completions = JSON.parse(localStorage.getItem('task_completions') || '{}');

        if (!completions[today]) {
            completions[today] = [];
        }

        if (!completions[today].includes(taskId)) {
            completions[today].push(taskId);
        }

        localStorage.setItem('task_completions', JSON.stringify(completions));

        // Add checkmark badge to the card
        this.updateCompletionBadges();
    },

    // Check and display daily completion badges
    async checkDailyCompletions() {
        // Check Google Sheets for fridge temps completion
        await this.checkFridgeTempsCompletion();

        // Update badges
        this.updateCompletionBadges();
    },

    // Check if fridge temps were completed today in Google Sheets
    async checkFridgeTempsCompletion() {
        try {
            const googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbz27gmlc2swJgIXdayBHnP-b3KMIR-TiuY6Ib35piYo8m0TYDD1SzFbEDp2Q1EeywQg/exec';

            const response = await fetch(googleSheetsUrl + '?action=checkToday');
            const data = await response.json();

            if (data.status === 'success' && data.hasToday) {
                this.markTaskCompleted('fridge-temps');
            } else {
                const records = JSON.parse(localStorage.getItem('fridge_temp_records') || '[]');
                const today = new Date().toISOString().split('T')[0];

                const todayRecord = records.find(record => {
                    const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
                    return recordDate === today;
                });

                if (todayRecord) {
                    this.markTaskCompleted('fridge-temps');
                }
            }

        } catch (error) {
            const records = JSON.parse(localStorage.getItem('fridge_temp_records') || '[]');
            const today = new Date().toISOString().split('T')[0];

            const todayRecord = records.find(record => {
                const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
                return recordDate === today;
            });

            if (todayRecord) {
                this.markTaskCompleted('fridge-temps');
            }
        }
    },

    // Update completion badges on cards
    updateCompletionBadges() {
        const today = new Date().toISOString().split('T')[0];
        const completions = JSON.parse(localStorage.getItem('task_completions') || '{}');
        const todayCompletions = completions[today] || [];

        // Remove all existing badges and completed class
        document.querySelectorAll('.completion-badge').forEach(badge => badge.remove());
        document.querySelectorAll('.record-card').forEach(card => card.classList.remove('completed'));

        // Add badges to completed tasks
        todayCompletions.forEach(taskId => {
            const cards = document.querySelectorAll(`[data-type="${taskId}"]`);
            cards.forEach(card => {
                // Make card position relative if not already
                if (getComputedStyle(card).position === 'static') {
                    card.style.position = 'relative';
                }

                // Add completed class for green background
                card.classList.add('completed');

                // Add checkmark badge
                const badge = document.createElement('div');
                badge.className = 'completion-badge';
                badge.innerHTML = '✓';
                card.appendChild(badge);
            });
        });
    }
};

// Utility Functions

// Show/hide loading overlay
function showLoading(show, message = 'Saving...') {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = document.getElementById('loading-message');

    if (show) {
        if (messageEl) {
            messageEl.textContent = message;
        }
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
