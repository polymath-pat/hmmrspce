import { api } from './api.js';
import { User, ApiError } from './types.js';

class App {
  private currentUser: User | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.setupEventListeners();
    await this.checkAuth();
    this.updateNavbar();
  }

  private setupEventListeners(): void {
    // Auth modal
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form') as HTMLFormElement;
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

  private async checkAuth(): Promise<void> {
    if (api.isAuthenticated()) {
      try {
        this.currentUser = await api.getCurrentUser();
      } catch (error) {
        // Token might be expired, clear it
        localStorage.removeItem('token');
        this.currentUser = null;
      }
    }
  }

  private updateNavbar(): void {
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');

    if (this.currentUser) {
      authBtn!.style.display = 'none';
      logoutBtn!.style.display = 'inline-block';
      userName!.textContent = `Welcome, ${this.currentUser.username}`;
      userName!.style.display = 'inline';
    } else {
      authBtn!.style.display = 'inline-block';
      logoutBtn!.style.display = 'none';
      userName!.style.display = 'none';
    }
  }

  private showAuthModal(): void {
    const modal = document.getElementById('auth-modal');
    modal!.style.display = 'flex';
  }

  private hideAuthModal(): void {
    const modal = document.getElementById('auth-modal');
    modal!.style.display = 'none';
    this.clearAuthForm();
  }

  private toggleAuthMode(): void {
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit');
    const toggleBtn = document.getElementById('auth-toggle');
    const emailField = document.getElementById('email');
    const passwordConfirmGroup = document.getElementById('password-confirm-group');
    const nameFields = document.getElementById('name-fields');

    const isLogin = title!.textContent === 'Login';

    if (isLogin) {
      // Switch to register
      title!.textContent = 'Register';
      submitBtn!.textContent = 'Register';
      toggleBtn!.textContent = 'Already have an account? Login';
      emailField!.style.display = 'block';
      passwordConfirmGroup!.style.display = 'block';
      nameFields!.style.display = 'block';
    } else {
      // Switch to login
      title!.textContent = 'Login';
      submitBtn!.textContent = 'Login';
      toggleBtn!.textContent = "Don't have an account? Register";
      emailField!.style.display = 'none';
      passwordConfirmGroup!.style.display = 'none';
      nameFields!.style.display = 'none';
    }

    this.clearAuthForm();
  }

  private clearAuthForm(): void {
    const form = document.getElementById('auth-form') as HTMLFormElement;
    const errorDiv = document.getElementById('auth-error');
    form.reset();
    errorDiv!.style.display = 'none';
  }

  private async handleAuthSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const isLogin = document.getElementById('auth-modal-title')!.textContent === 'Login';

    this.showLoading();

    try {
      if (isLogin) {
        const response = await api.login({
          username: formData.get('username') as string,
          password: formData.get('password') as string,
        });
        this.currentUser = response.user;
      } else {
        const response = await api.register({
          username: formData.get('username') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          password_confirm: formData.get('password_confirm') as string,
          first_name: formData.get('first_name') as string || undefined,
          last_name: formData.get('last_name') as string || undefined,
        });
        this.currentUser = response.user;
      }

      this.hideLoading();
      this.hideAuthModal();
      this.updateNavbar();
      this.showNotification('Successfully logged in!', 'success');
      
      // Refresh page content if needed
      window.location.reload();
    } catch (error) {
      this.hideLoading();
      this.showAuthError(error as ApiError);
    }
  }

  private showAuthError(error: ApiError): void {
    const errorDiv = document.getElementById('auth-error');
    let message = 'An error occurred';
    
    if (error.detail) {
      message = error.detail;
    } else if (typeof error === 'object') {
      // Handle field-specific errors
      const messages: string[] = [];
      for (const [field, errors] of Object.entries(error)) {
        if (Array.isArray(errors)) {
          messages.push(`${field}: ${errors.join(', ')}`);
        }
      }
      if (messages.length > 0) {
        message = messages.join('; ');
      }
    }

    errorDiv!.textContent = message;
    errorDiv!.style.display = 'block';
  }

  private async logout(): Promise<void> {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    this.currentUser = null;
    this.updateNavbar();
    this.showNotification('Successfully logged out!', 'success');
    window.location.href = '/';
  }

  private showLoading(): void {
    const loading = document.getElementById('loading');
    loading!.style.display = 'flex';
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    loading!.style.display = 'none';
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications!.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Public methods for other modules
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public showError(message: string): void {
    this.showNotification(message, 'error');
  }

  public showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  (window as any).app = new App();
});