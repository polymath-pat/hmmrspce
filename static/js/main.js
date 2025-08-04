import { api } from './api.js';
class App {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    async init() {
        this.setupEventListeners();
        await this.checkAuth();
        this.updateNavbar();
    }
    setupEventListeners() {
        // Auth modal
        const authBtn = document.getElementById('auth-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const authModal = document.getElementById('auth-modal');
        const authForm = document.getElementById('auth-form');
        const authToggle = document.getElementById('auth-toggle');
        const modalClose = document.querySelector('.modal-close');
        authBtn?.addEventListener('click', () => this.showAuthModal());
        logoutBtn?.addEventListener('click', () => this.logout());
        authToggle?.addEventListener('click', () => this.toggleAuthMode());
        modalClose?.addEventListener('click', () => this.hideAuthModal());
        authForm?.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        // Close modal on backdrop click
        authModal?.addEventListener('click', (e) => {
            if (e.target === authModal) {
                this.hideAuthModal();
            }
        });
    }
    async checkAuth() {
        if (api.isAuthenticated()) {
            try {
                this.currentUser = await api.getCurrentUser();
            }
            catch (error) {
                // Token might be expired, clear it
                localStorage.removeItem('token');
                this.currentUser = null;
            }
        }
    }
    updateNavbar() {
        const authBtn = document.getElementById('auth-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userName = document.getElementById('user-name');
        if (this.currentUser) {
            authBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            userName.textContent = `Welcome, ${this.currentUser.username}`;
            userName.style.display = 'inline';
        }
        else {
            authBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            userName.style.display = 'none';
        }
    }
    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'flex';
    }
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'none';
        this.clearAuthForm();
    }
    toggleAuthMode() {
        const title = document.getElementById('auth-modal-title');
        const submitBtn = document.getElementById('auth-submit');
        const toggleBtn = document.getElementById('auth-toggle');
        const emailField = document.getElementById('email');
        const passwordConfirmGroup = document.getElementById('password-confirm-group');
        const nameFields = document.getElementById('name-fields');
        const isLogin = title.textContent === 'Login';
        if (isLogin) {
            // Switch to register
            title.textContent = 'Register';
            submitBtn.textContent = 'Register';
            toggleBtn.textContent = 'Already have an account? Login';
            emailField.style.display = 'block';
            passwordConfirmGroup.style.display = 'block';
            nameFields.style.display = 'block';
        }
        else {
            // Switch to login
            title.textContent = 'Login';
            submitBtn.textContent = 'Login';
            toggleBtn.textContent = "Don't have an account? Register";
            emailField.style.display = 'none';
            passwordConfirmGroup.style.display = 'none';
            nameFields.style.display = 'none';
        }
        this.clearAuthForm();
    }
    clearAuthForm() {
        const form = document.getElementById('auth-form');
        const errorDiv = document.getElementById('auth-error');
        form.reset();
        errorDiv.style.display = 'none';
    }
    async handleAuthSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const isLogin = document.getElementById('auth-modal-title').textContent === 'Login';
        this.showLoading();
        try {
            if (isLogin) {
                const response = await api.login({
                    username: formData.get('username'),
                    password: formData.get('password'),
                });
                this.currentUser = response.user;
            }
            else {
                const response = await api.register({
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    password_confirm: formData.get('password_confirm'),
                    first_name: formData.get('first_name') || undefined,
                    last_name: formData.get('last_name') || undefined,
                });
                this.currentUser = response.user;
            }
            this.hideLoading();
            this.hideAuthModal();
            this.updateNavbar();
            this.showNotification('Successfully logged in!', 'success');
            // Refresh page content if needed
            window.location.reload();
        }
        catch (error) {
            this.hideLoading();
            this.showAuthError(error);
        }
    }
    showAuthError(error) {
        const errorDiv = document.getElementById('auth-error');
        let message = 'An error occurred';
        if (error.detail) {
            message = error.detail;
        }
        else if (typeof error === 'object') {
            // Handle field-specific errors
            const messages = [];
            for (const [field, errors] of Object.entries(error)) {
                if (Array.isArray(errors)) {
                    messages.push(`${field}: ${errors.join(', ')}`);
                }
            }
            if (messages.length > 0) {
                message = messages.join('; ');
            }
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    async logout() {
        try {
            await api.logout();
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        this.currentUser = null;
        this.updateNavbar();
        this.showNotification('Successfully logged out!', 'success');
        window.location.href = '/';
    }
    showLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'flex';
    }
    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }
    showNotification(message, type = 'success') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notifications.appendChild(notification);
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    // Public methods for other modules
    getCurrentUser() {
        return this.currentUser;
    }
    isAuthenticated() {
        return !!this.currentUser;
    }
    showError(message) {
        this.showNotification(message, 'error');
    }
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
}
// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
//# sourceMappingURL=main.js.map