import { api } from './api.js';
import { Collection, CollectionShare, ApiError } from './types.js';

class CollectionsPage {
  private currentCollection: Collection | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    this.setupEventListeners();
    await this.loadCollections();
  }

  private setupEventListeners(): void {
    // New collection button
    const newCollectionBtn = document.getElementById('new-collection-btn');
    newCollectionBtn?.addEventListener('click', () => this.showCollectionModal());

    // Collection form
    const collectionForm = document.getElementById('collection-form') as HTMLFormElement;
    collectionForm?.addEventListener('submit', (e) => this.handleCollectionSubmit(e));

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideAllModals());
    });

    // Collection cancel button
    const cancelBtn = document.getElementById('collection-cancel');
    cancelBtn?.addEventListener('click', () => this.hideAllModals());

    // Collection actions
    const viewBtn = document.getElementById('view-collection-btn');
    const editBtn = document.getElementById('edit-collection-btn');
    const shareBtn = document.getElementById('share-collection-btn');
    const deleteBtn = document.getElementById('delete-collection-btn');

    viewBtn?.addEventListener('click', () => this.viewCollection());
    editBtn?.addEventListener('click', () => this.editCollection());
    shareBtn?.addEventListener('click', () => this.showShareModal());
    deleteBtn?.addEventListener('click', () => this.deleteCollection());

    // Share form
    const shareForm = document.getElementById('share-form') as HTMLFormElement;
    shareForm?.addEventListener('submit', (e) => this.handleShareSubmit(e));

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideAllModals();
        }
      });
    });
  }

  private async loadCollections(): Promise<void> {
    try {
      this.showLoading();
      const collections = await api.getCollections();
      this.collections = collections; // Store collections for later use
      this.renderCollections(collections);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load collections');
      console.error('Error loading collections:', error);
    }
  }

  private renderCollections(collections: Collection[]): void {
    const grid = document.getElementById('collections-grid');
    const noCollections = document.getElementById('no-collections');

    if (!grid) return;

    if (collections.length === 0) {
      grid.style.display = 'none';
      noCollections!.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    noCollections!.style.display = 'none';

    grid.innerHTML = collections.map(collection => `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${this.escapeHtml(collection.name)}</h3>
          <div class="card-actions">
            <button class="btn btn-secondary" onclick="collectionsPage.showCollectionActions(${collection.id})">
              ⋯
            </button>
          </div>
        </div>
        <div class="card-body">
          <p class="text-muted">${this.escapeHtml(collection.description || 'No description')}</p>
        </div>
        <div class="card-footer">
          <span>${collection.items_count} items</span>
          <span class="visibility-badge visibility-${collection.visibility}">
            ${this.getVisibilityIcon(collection.visibility)} ${collection.visibility}
          </span>
        </div>
      </div>
    `).join('');
  }

  private getVisibilityIcon(visibility: string): string {
    switch (visibility) {
      case 'public': return '🌐';
      case 'unlisted': return '🔗';
      case 'private': return '🔒';
      default: return '🔒';
    }
  }

  private showCollectionModal(collection?: Collection): void {
    const modal = document.getElementById('collection-modal');
    const title = document.getElementById('collection-modal-title');
    const form = document.getElementById('collection-form') as HTMLFormElement;
    const submitBtn = document.getElementById('collection-submit');

    if (collection) {
      title!.textContent = 'Edit Collection';
      submitBtn!.textContent = 'Update Collection';
      
      // Populate form
      (form.elements.namedItem('name') as HTMLInputElement).value = collection.name;
      (form.elements.namedItem('description') as HTMLTextAreaElement).value = collection.description || '';
      (form.elements.namedItem('visibility') as HTMLSelectElement).value = collection.visibility;
      
      this.currentCollection = collection;
    } else {
      title!.textContent = 'New Collection';
      submitBtn!.textContent = 'Create Collection';
      form.reset();
      this.currentCollection = null;
    }

    modal!.style.display = 'flex';
  }

  private async handleCollectionSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      visibility: formData.get('visibility') as 'private' | 'public' | 'unlisted',
    };

    try {
      this.showLoading();
      
      if (this.currentCollection) {
        await api.updateCollection(this.currentCollection.id, data);
        this.showSuccess('Collection updated successfully!');
      } else {
        await api.createCollection(data);
        this.showSuccess('Collection created successfully!');
      }
      
      this.hideLoading();
      this.hideAllModals();
      await this.loadCollections();
    } catch (error) {
      this.hideLoading();
      this.showCollectionError(error as ApiError);
    }
  }

  private showCollectionActionsModal(collectionId: number): void {
    const collection = this.findCollectionById(collectionId);
    if (!collection) return;

    this.currentCollection = collection;
    const modal = document.getElementById('collection-actions-modal');
    modal!.style.display = 'flex';
  }

  private collections: Collection[] = [];

  private findCollectionById(id: number): Collection | null {
    return this.collections.find(c => c.id === id) || null;
  }

  private viewCollection(): void {
    if (this.currentCollection) {
      window.location.href = `/collections/${this.currentCollection.id}/items/`;
    }
    this.hideAllModals();
  }

  private editCollection(): void {
    if (this.currentCollection) {
      this.hideAllModals();
      this.showCollectionModal(this.currentCollection);
    }
  }

  private async showShareModal(): Promise<void> {
    if (!this.currentCollection) return;

    const modal = document.getElementById('share-modal');
    modal!.style.display = 'flex';

    // Load existing shares
    try {
      const shares = await api.getCollectionShares(this.currentCollection.id);
      this.renderShares(shares);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  }

  private renderShares(shares: CollectionShare[]): void {
    const sharesList = document.getElementById('shares-list');
    if (!sharesList) return;

    if (shares.length === 0) {
      sharesList.innerHTML = '<p class="text-muted">No one has access to this collection yet.</p>';
      return;
    }

    sharesList.innerHTML = shares.map(share => `
      <div class="card">
        <div class="card-body">
          <strong>${this.escapeHtml(share.shared_with.username)}</strong>
          <span class="text-muted">(${share.permission_level})</span>
        </div>
      </div>
    `).join('');
  }

  private async handleShareSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    if (!this.currentCollection) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      shared_with_username: formData.get('shared_with_username') as string,
      permission_level: formData.get('permission_level') as 'view' | 'edit' | 'manage',
    };

    try {
      await api.shareCollection(this.currentCollection.id, data);
      this.showSuccess('Collection shared successfully!');
      form.reset();
      
      // Reload shares
      const shares = await api.getCollectionShares(this.currentCollection.id);
      this.renderShares(shares);
    } catch (error) {
      this.showShareError(error as ApiError);
    }
  }

  private async deleteCollection(): Promise<void> {
    if (!this.currentCollection) return;

    if (!confirm(`Are you sure you want to delete "${this.currentCollection.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      this.showLoading();
      await api.deleteCollection(this.currentCollection.id);
      this.hideLoading();
      this.hideAllModals();
      this.showSuccess('Collection deleted successfully!');
      await this.loadCollections();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to delete collection');
      console.error('Error deleting collection:', error);
    }
  }

  private hideAllModals(): void {
    document.querySelectorAll('.modal').forEach(modal => {
      (modal as HTMLElement).style.display = 'none';
    });
    this.clearErrors();
  }

  private clearErrors(): void {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  }

  private showCollectionError(error: ApiError): void {
    const errorDiv = document.getElementById('collection-error');
    this.displayError(errorDiv, error);
  }

  private showShareError(error: ApiError): void {
    const errorDiv = document.getElementById('share-error');
    this.displayError(errorDiv, error);
  }

  private displayError(errorDiv: HTMLElement | null, error: ApiError): void {
    if (!errorDiv) return;

    let message = 'An error occurred';
    
    if (error.detail) {
      message = error.detail;
    } else if (typeof error === 'object') {
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

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private showLoading(): void {
    const loading = document.getElementById('loading');
    loading!.style.display = 'flex';
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    loading!.style.display = 'none';
  }

  private showError(message: string): void {
    (window as any).app?.showError(message);
  }

  private showSuccess(message: string): void {
    (window as any).app?.showSuccess(message);
  }

  // Public method for template onclick handlers
  public showCollectionActions(collectionId: number): void {
    this.showCollectionActionsModal(collectionId);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  (window as any).collectionsPage = new CollectionsPage();
});