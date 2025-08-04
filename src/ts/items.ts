import { api } from './api.js';
import { Collection, Item, ApiError } from './types.js';

class ItemsPage {
  private collectionId: number;
  private collection: Collection | null = null;
  private items: Item[] = [];
  private currentItem: Item | null = null;

  constructor() {
    // Get collection ID from URL
    const pathParts = window.location.pathname.split('/');
    this.collectionId = parseInt(pathParts[2]); // /collections/1/items/
    
    this.init();
  }

  private async init(): Promise<void> {
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    this.setupEventListeners();
    await this.loadCollection();
    await this.loadItems();
  }

  private setupEventListeners(): void {
    // New item button
    const newItemBtn = document.getElementById('new-item-btn');
    newItemBtn?.addEventListener('click', () => this.showItemModal());

    // Item form
    const itemForm = document.getElementById('item-form') as HTMLFormElement;
    itemForm?.addEventListener('submit', (e) => this.handleItemSubmit(e));

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideAllModals());
    });

    // Item cancel button
    const cancelBtn = document.getElementById('item-cancel');
    cancelBtn?.addEventListener('click', () => this.hideAllModals());

    // Item actions
    const editBtn = document.getElementById('edit-item-btn');
    const deleteBtn = document.getElementById('delete-item-btn');

    editBtn?.addEventListener('click', () => this.editItem());
    deleteBtn?.addEventListener('click', () => this.deleteItem());

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideAllModals();
        }
      });
    });
  }

  private async loadCollection(): Promise<void> {
    try {
      this.collection = await api.getCollection(this.collectionId);
      this.updateCollectionHeader();
    } catch (error) {
      this.showError('Failed to load collection');
      console.error('Error loading collection:', error);
    }
  }

  private updateCollectionHeader(): void {
    if (!this.collection) return;

    const title = document.getElementById('collection-title');
    const description = document.getElementById('collection-description');

    if (title) {
      title.textContent = this.collection.name;
    }
    if (description) {
      description.textContent = this.collection.description || '';
    }
  }

  private async loadItems(): Promise<void> {
    try {
      this.showLoading();
      const items = await api.getItems(this.collectionId);
      this.items = items;
      this.renderItems(items);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load items');
      console.error('Error loading items:', error);
    }
  }

  private renderItems(items: Item[]): void {
    const grid = document.getElementById('items-grid');
    const noItems = document.getElementById('no-items');

    if (!grid) return;

    if (items.length === 0) {
      grid.style.display = 'none';
      noItems!.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    noItems!.style.display = 'none';

    grid.innerHTML = items.map(item => `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${this.escapeHtml(item.name)}</h3>
          <div class="card-actions">
            <button class="btn btn-secondary" onclick="itemsPage.showItemActions(${item.id})">
              ⋯
            </button>
          </div>
        </div>
        <div class="card-body">
          <p class="text-muted">${this.escapeHtml(item.description || 'No description')}</p>
          ${this.renderCustomFields(item.custom_fields)}
        </div>
        <div class="card-footer">
          <span class="visibility-badge visibility-${item.visibility}">
            ${this.getVisibilityIcon(item.visibility)} ${item.visibility}
          </span>
        </div>
      </div>
    `).join('');
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

  private getVisibilityIcon(visibility: string): string {
    switch (visibility) {
      case 'public': return '🌐';
      case 'collection': return '📁';
      case 'private': return '🔒';
      default: return '🔒';
    }
  }

  private showItemModal(item?: Item): void {
    const modal = document.getElementById('item-modal');
    const title = document.getElementById('item-modal-title');
    const form = document.getElementById('item-form') as HTMLFormElement;
    const submitBtn = document.getElementById('item-submit');

    if (item) {
      title!.textContent = 'Edit Item';
      submitBtn!.textContent = 'Update Item';
      
      // Populate form
      (form.elements.namedItem('name') as HTMLInputElement).value = item.name;
      (form.elements.namedItem('description') as HTMLTextAreaElement).value = item.description || '';
      (form.elements.namedItem('visibility') as HTMLSelectElement).value = item.visibility;
      (form.elements.namedItem('custom_fields') as HTMLTextAreaElement).value = 
        JSON.stringify(item.custom_fields, null, 2);
      
      this.currentItem = item;
    } else {
      title!.textContent = 'New Item';
      submitBtn!.textContent = 'Add Item';
      form.reset();
      this.currentItem = null;
    }

    modal!.style.display = 'flex';
  }

  private async handleItemSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Parse custom fields JSON
    let customFields = {};
    const customFieldsText = formData.get('custom_fields') as string;
    if (customFieldsText.trim()) {
      try {
        customFields = JSON.parse(customFieldsText);
      } catch (error) {
        this.showItemError({ detail: 'Invalid JSON in custom fields' });
        return;
      }
    }

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      visibility: formData.get('visibility') as 'private' | 'public' | 'collection',
      custom_fields: customFields,
      collection: this.collectionId,
    };

    try {
      this.showLoading();
      
      if (this.currentItem) {
        await api.updateItem(this.currentItem.id, data);
        this.showSuccess('Item updated successfully!');
      } else {
        await api.createItem(data);
        this.showSuccess('Item added successfully!');
      }
      
      this.hideLoading();
      this.hideAllModals();
      await this.loadItems();
    } catch (error) {
      this.hideLoading();
      this.showItemError(error as ApiError);
    }
  }

  private showItemActionsModal(itemId: number): void {
    const item = this.findItemById(itemId);
    if (!item) return;

    this.currentItem = item;
    const modal = document.getElementById('item-actions-modal');
    modal!.style.display = 'flex';
  }

  private findItemById(id: number): Item | null {
    return this.items.find(i => i.id === id) || null;
  }

  private editItem(): void {
    if (this.currentItem) {
      this.hideAllModals();
      this.showItemModal(this.currentItem);
    }
  }

  private async deleteItem(): Promise<void> {
    if (!this.currentItem) return;

    if (!confirm(`Are you sure you want to delete "${this.currentItem.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      this.showLoading();
      await api.deleteItem(this.currentItem.id);
      this.hideLoading();
      this.hideAllModals();
      this.showSuccess('Item deleted successfully!');
      await this.loadItems();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to delete item');
      console.error('Error deleting item:', error);
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

  private showItemError(error: ApiError): void {
    const errorDiv = document.getElementById('item-error');
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
  public showItemActions(itemId: number): void {
    this.showItemActionsModal(itemId);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  (window as any).itemsPage = new ItemsPage();
});