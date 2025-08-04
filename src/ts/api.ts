import { User, Collection, Item, CollectionShare, AuthResponse, ApiError } from './types.js';

class ApiClient {
  private baseUrl: string = '/api';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw error;
    }

    return response.json();
  }

  // Auth methods
  async register(userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(response.token);
    return response;
  }

  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout/', { method: 'POST' });
    this.clearToken();
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Collections methods
  async getCollections(): Promise<Collection[]> {
    const response = await this.request<{results: Collection[]}>('/collections/');
    return response.results;
  }

  async getCollection(id: number): Promise<Collection> {
    return this.request<Collection>(`/collections/${id}/`);
  }

  async createCollection(data: {
    name: string;
    description?: string;
    visibility?: 'private' | 'public' | 'unlisted';
  }): Promise<Collection> {
    return this.request<Collection>('/collections/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: number, data: Partial<Collection>): Promise<Collection> {
    return this.request<Collection>(`/collections/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: number): Promise<void> {
    await this.request(`/collections/${id}/`, { method: 'DELETE' });
  }

  async getPublicCollections(): Promise<Collection[]> {
    const response = await this.request<{results: Collection[]}>('/collections/public/');
    return response.results || [];
  }

  async getUnlistedCollections(): Promise<Collection[]> {
    const response = await this.request<{results: Collection[]}>('/collections/unlisted/');
    return response.results || [];
  }

  // Items methods
  async getItems(collectionId?: number): Promise<Item[]> {
    const params = collectionId ? `?collection=${collectionId}` : '';
    const response = await this.request<{results: Item[]}>(`/items/${params}`);
    return response.results;
  }

  async getItem(id: number): Promise<Item> {
    return this.request<Item>(`/items/${id}/`);
  }

  async createItem(data: {
    name: string;
    description?: string;
    collection: number;
    visibility?: 'private' | 'public' | 'collection';
    custom_fields?: Record<string, any>;
  }): Promise<Item> {
    return this.request<Item>('/items/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: number, data: Partial<Item>): Promise<Item> {
    return this.request<Item>(`/items/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: number): Promise<void> {
    await this.request(`/items/${id}/`, { method: 'DELETE' });
  }

  async getPublicItems(collectionId?: number): Promise<Item[]> {
    const params = collectionId ? `?collection=${collectionId}` : '';
    const response = await this.request<{results: Item[]}>(`/items/public/${params}`);
    return response.results || [];
  }

  // Collection sharing methods
  async getCollectionShares(collectionId: number): Promise<CollectionShare[]> {
    return this.request<CollectionShare[]>(`/collections/${collectionId}/shares/`);
  }

  async shareCollection(collectionId: number, data: {
    shared_with_username: string;
    permission_level: 'view' | 'edit' | 'manage';
  }): Promise<CollectionShare> {
    return this.request<CollectionShare>(`/collections/${collectionId}/shares/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User methods
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me/');
  }
}

export const api = new ApiClient();