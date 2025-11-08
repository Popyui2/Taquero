// Authentication Module
const Auth = {
    currentUser: null,
    accessToken: null,
    TEST_PASSWORD: '123456', // Simple password for testing (REMOVE IN PRODUCTION!)

    // Initialize authentication
    init() {
        // Check if user is already logged in (from localStorage)
        const savedUser = localStorage.getItem('mpi_user');
        const savedToken = localStorage.getItem('mpi_token');

        if (savedUser && savedToken) {
            this.currentUser = JSON.parse(savedUser);
            this.accessToken = savedToken;
            this.showApp();
        }
    },

    // Test login with simple password
    testLogin(password) {
        console.log('Test login attempt with password:', password);
        console.log('Expected password:', this.TEST_PASSWORD);

        if (password === this.TEST_PASSWORD) {
            const testUser = {
                name: 'Test User',
                email: 'test@hotlikeamexican.com',
                picture: ''
            };
            console.log('Password correct! Logging in as:', testUser);
            this.saveSession(testUser, 'test-token-' + Date.now());
            this.showApp();
            return true;
        }
        console.log('Password incorrect');
        return false;
    },

    // Show app screen
    showApp() {
        console.log('Showing app screen...', this.currentUser);
        const loginScreen = document.getElementById('login-screen');
        const appScreen = document.getElementById('app-screen');
        const userName = document.getElementById('user-name');

        if (loginScreen) loginScreen.classList.remove('active');
        if (appScreen) appScreen.classList.add('active');
        if (userName && this.currentUser) {
            userName.textContent = this.currentUser.name;
        }

        console.log('App screen should now be visible');
    },

    // Show login screen
    showLogin() {
        document.getElementById('app-screen').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
    },

    // Save user session
    saveSession(user, token) {
        this.currentUser = user;
        this.accessToken = token;
        localStorage.setItem('mpi_user', JSON.stringify(user));
        localStorage.setItem('mpi_token', token);
    },

    // Clear user session
    clearSession() {
        this.currentUser = null;
        this.accessToken = null;
        localStorage.removeItem('mpi_user');
        localStorage.removeItem('mpi_token');
    },

    // Logout
    logout() {
        this.clearSession();
        this.showLogin();
        // Revoke Google token
        if (window.google && window.google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
    }
};

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    // Decode JWT token to get user info
    const user = parseJwt(response.credential);

    // Validate user email domain (optional - uncomment to restrict to specific domain)
    // if (!user.email.endsWith('@hotlikeamexican.com')) {
    //     showToast('Please sign in with your work email', 'error');
    //     return;
    // }

    // Save session
    Auth.saveSession({
        name: user.name,
        email: user.email,
        picture: user.picture
    }, response.credential);

    // Show app
    Auth.showApp();
    showToast('Welcome, ' + user.name + '!', 'success');
}

// Parse JWT token
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // Setup test login form
    const testLoginForm = document.getElementById('test-login-form');
    if (testLoginForm) {
        testLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('test-password').value;
            if (Auth.testLogin(password)) {
                // Login successful - showApp() is called in testLogin()
                if (typeof showToast === 'function') {
                    showToast('Test login successful!', 'success');
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast('Incorrect password', 'error');
                }
                alert('Incorrect password. Try: 123456');
            }
        });
    }
});
