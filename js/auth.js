// Authentication Module
const Auth = {
    currentUser: null,
    APP_PASSWORD: '123456', // Shared password for all users
    availableUsers: ['Martin', 'Andres', 'Hugo', 'Marcela', 'Temp Employee'],

    // Initialize authentication
    init() {
        // Check if user is already logged in (from localStorage)
        const savedUser = localStorage.getItem('taquero_user');

        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
        }
    },

    // Check password
    checkPassword(password) {
        return password === this.APP_PASSWORD;
    },

    // Show user selection screen
    showUserSelection() {
        const loginScreen = document.getElementById('login-screen');
        const userSelectionScreen = document.getElementById('user-selection-screen');

        if (loginScreen) loginScreen.classList.remove('active');
        if (userSelectionScreen) userSelectionScreen.classList.add('active');
    },

    // Select user
    selectUser(userName) {
        const user = {
            name: userName,
            loginTime: new Date().toISOString()
        };

        this.currentUser = user;
        localStorage.setItem('taquero_user', JSON.stringify(user));

        this.showApp();

        if (typeof showToast === 'function') {
            showToast('Welcome, ' + userName + '!', 'success');
        }
    },

    // Show app screen
    showApp() {
        const loginScreen = document.getElementById('login-screen');
        const userSelectionScreen = document.getElementById('user-selection-screen');
        const appScreen = document.getElementById('app-screen');
        const userName = document.getElementById('user-name');

        if (loginScreen) loginScreen.classList.remove('active');
        if (userSelectionScreen) userSelectionScreen.classList.remove('active');
        if (appScreen) appScreen.classList.add('active');

        if (userName && this.currentUser) {
            userName.textContent = this.currentUser.name;
        }
    },

    // Show login screen
    showLogin() {
        const appScreen = document.getElementById('app-screen');
        const userSelectionScreen = document.getElementById('user-selection-screen');
        const loginScreen = document.getElementById('login-screen');

        if (appScreen) appScreen.classList.remove('active');
        if (userSelectionScreen) userSelectionScreen.classList.remove('active');
        if (loginScreen) loginScreen.classList.add('active');
    },

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('taquero_user');
        this.showLogin();
    }
};

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth module initializing...');
    Auth.init();

    // Setup password login form
    const passwordLoginForm = document.getElementById('password-login-form');
    console.log('Password form found:', passwordLoginForm);

    if (passwordLoginForm) {
        passwordLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted');

            const password = document.getElementById('login-password').value;
            console.log('Password entered:', password);

            if (Auth.checkPassword(password)) {
                console.log('Password correct, showing user selection');
                Auth.showUserSelection();
            } else {
                console.log('Password incorrect');
                if (typeof showToast === 'function') {
                    showToast('Incorrect password', 'error');
                } else {
                    alert('Incorrect password. Try: 123456');
                }
            }
        });
    } else {
        console.error('Password login form not found!');
    }

    // Setup user selection cards
    const userCards = document.querySelectorAll('.user-card');
    userCards.forEach(card => {
        card.addEventListener('click', () => {
            const userName = card.dataset.user;
            Auth.selectUser(userName);
        });
    });

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }
});
