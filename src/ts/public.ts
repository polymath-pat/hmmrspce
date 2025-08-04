import { api } from './api.js';
import { Collection } from './types.js';

class PublicPage {
  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadPublicCollections();
  }

  private async loadPublicCollections(): Promise<void> {
    try {
      this.showLoading();
      const collections = await api.getPublicCollections();
      this.renderPublicCollections(collections);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load public collections');
      console.error('Error loading public collections:', error);
    }
  }

  private renderPublicCollections(collections: Collection[]): void {
    const grid = document.getElementById('public-collections-grid');
    const noCollections = document.getElementById('no-public-collections');

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
          <span class="text-muted">by ${this.escapeHtml(collection.created_by.username)}</span>
        </div>
        <div class="card-body">
          <p class="text-muted">${this.escapeHtml(collection.description || 'No description')}</p>
        </div>
        <div class="card-footer">
          <span>${collection.items_count} items</span>
          <button class="btn btn-primary" onclick="publicPage.viewPublicCollection(${collection.id})">
            View Collection
          </button>
        </div>
      </div>
    `).join('');
  }

  private async viewPublicCollectionInternal(collectionId: number): Promise<void> {
    try {
      this.showLoading();
      const items = await api.getPublicItems(collectionId);
      const collection = await api.getCollection(collectionId);
      this.showCollectionModal(collection, items);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load collection items');
      console.error('Error loading collection items:', error);
    }
  }

  private showCollectionModal(collection: Collection, items: any[]): void {
    // Create a modal to show collection items
    const modalHtml = `
      <div id="collection-view-modal" class="modal" style="display: flex;">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h2>${this.escapeHtml(collection.name)}</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-1">by ${this.escapeHtml(collection.created_by.username)}</p>
            ${collection.description ? `<p class="mb-2">${this.escapeHtml(collection.description)}</p>` : ''}
            
            <h3>Items (${items.length})</h3>
            <div class="grid grid-2">
              ${items.map(item => `
                <div class="card">
                  <div class="card-header">
                    <h4 class="card-title">${this.escapeHtml(item.name)}</h4>
                  </div>
                  <div class="card-body">
                    ${item.description ? `<p class="text-muted">${this.escapeHtml(item.description)}</p>` : ''}
                    ${this.renderCustomFields(item.custom_fields)}
                  </div>
                </div>
              `).join('')}
            </div>
            
            ${items.length === 0 ? '<p class="text-center text-muted">No items in this collection yet.</p>' : ''}
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('collection-view-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add event listeners
    const modal = document.getElementById('collection-view-modal');
    const closeBtn = modal!.querySelector('.modal-close');
    
    closeBtn!.addEventListener('click', () => modal!.remove());
    modal!.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal!.remove();
      }
    });
  }

  private renderCustomFields(customFields: Record<string, any>): string {
    if (!customFields || Object.keys(customFields).length === 0) {
      return '';
    }

    const fields = Object.entries(customFields)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `<div><strong>${displayKey}:</strong> ${this.escapeHtml(String(value))}</div>`;
      })
      .join('');

    return fields ? `<div class="custom-fields mt-1">${fields}</div>` : '';
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

  // Public method for template onclick handlers
  public viewPublicCollection(collectionId: number): void {
    this.viewPublicCollectionInternal(collectionId);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  (window as any).publicPage = new PublicPage();
});