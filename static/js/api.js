class ApiClient {
    constructor() {
        this.baseUrl = '/api';
        this.token = null;
        this.token = localStorage.getItem('token');
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };
        if (this.token) {
            headers['Authorization'] = `Token ${this.token}`;
        }
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({
                detail: `HTTP ${response.status}: ${response.statusText}`
            }));
            throw error;
        }
        return response.json();
    }
    // Auth methods
    async register(userData) {
        const response = await this.request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        this.setToken(response.token);
        return response;
    }
    async login(credentials) {
        const response = await this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        this.setToken(response.token);
        return response;
    }
    async logout() {
        await this.request('/auth/logout/', { method: 'POST' });
        this.clearToken();
    }
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }
    isAuthenticated() {
        return !!this.token;
    }
    // Collections methods
    async getCollections() {
        const response = await this.request('/collections/');
        return response.results;
    }
    async getCollection(id) {
        return this.request(`/collections/${id}/`);
    }
    async createCollection(data) {
        return this.request('/collections/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateCollection(id, data) {
        return this.request(`/collections/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
    async deleteCollection(id) {
        await this.request(`/collections/${id}/`, { method: 'DELETE' });
    }
    async getPublicCollections() {
        const response = await this.request('/collections/public/');
        return response.results || [];
    }
    async getUnlistedCollections() {
        const response = await this.request('/collections/unlisted/');
        return response.results || [];
    }
    // Items methods
    async getItems(collectionId) {
        const params = collectionId ? `?collection=${collectionId}` : '';
        const response = await this.request(`/items/${params}`);
        return response.results;
    }
    async getItem(id) {
        return this.request(`/items/${id}/`);
    }
    async createItem(data) {
        return this.request('/items/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateItem(id, data) {
        return this.request(`/items/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
    async deleteItem(id) {
        await this.request(`/items/${id}/`, { method: 'DELETE' });
    }
    async getPublicItems(collectionId) {
        const params = collectionId ? `?collection=${collectionId}` : '';
        const response = await this.request(`/items/public/${params}`);
        return response.results || [];
    }
    // Collection sharing methods
    async getCollectionShares(collectionId) {
        return this.request(`/collections/${collectionId}/shares/`);
    }
    async shareCollection(collectionId, data) {
        return this.request(`/collections/${collectionId}/shares/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    // User methods
    async getCurrentUser() {
        return this.request('/users/me/');
    }
}
export const api = new ApiClient();
//# sourceMappingURL=api.js.map