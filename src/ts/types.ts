// API Types for the collection app

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  visibility: 'private' | 'public' | 'unlisted';
  is_public: boolean;
  created_by: User;
  created_at: string;
  updated_at: string;
  items_count: number;
  user_permission: 'owner' | 'manage' | 'edit' | 'view' | null;
  shared_with_count: number;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  image?: string;
  custom_fields: Record<string, any>;
  visibility: 'private' | 'public' | 'collection';
  is_public: boolean;
  collection: number;
  collection_name: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  user_permission: 'owner' | 'manage' | 'edit' | 'view' | null;
}

export interface CollectionShare {
  id: number;
  collection: number;
  collection_name: string;
  shared_with: User;
  shared_with_username?: string;
  permission_level: 'view' | 'edit' | 'manage';
  created_at: string;
  created_by: User;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: any;
}