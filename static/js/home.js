import { api } from './api.js';
class HomePage {
    constructor() {
        this.init();
    }
    async init() {
        await this.loadRecentCollections();
        this.updateHeroActions();
    }
    async loadRecentCollections() {
        try {
            const collections = await api.getPublicCollections();
            this.renderRecentCollections(collections.slice(0, 6)); // Show latest 6
        }
        catch (error) {
            console.error('Error loading recent collections:', error);
            // Don't show error to user on home page, just log it
        }
    }
    renderRecentCollections(collections) {
        const container = document.getElementById('recent-collections');
        if (!container)
            return;
        if (collections.length === 0) {
            container.innerHTML = `
        <div class="card">
          <p class="text-muted text-center">No public collections yet. Be the first to share your collection!</p>
        </div>
      `;
            return;
        }
        container.innerHTML = collections.map(collection => `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${this.escapeHtml(collection.name)}</h3>
          <span class="text-muted">by ${this.escapeHtml(collection.created_by.username)}</span>
        </div>
        <div class="card-body">
          <p class="text-muted">${this.escapeHtml(collection.description || 'No description')}</p>
        </div>
        <div class="card-footer">
          <span>${collection.items_count} items</span>
          <a href="/public/collections/${collection.id}/" class="btn btn-primary">View Collection</a>
        </div>
      </div>
    `).join('');
    }
    updateHeroActions() {
        const heroActions = document.getElementById('hero-actions');
        if (!heroActions)
            return;
        if (api.isAuthenticated()) {
            heroActions.innerHTML = `
        <a href="/collections/" class="btn btn-primary">My Collections</a>
        <a href="/public/" class="btn btn-secondary">Explore Public Collections</a>
      `;
        }
        else {
            heroActions.innerHTML = `
        <button class="btn btn-primary" onclick="document.getElementById('auth-btn').click()">Get Started</button>
        <a href="/public/" class="btn btn-secondary">Explore Public Collections</a>
      `;
        }
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});
//# sourceMappingURL=home.js.map