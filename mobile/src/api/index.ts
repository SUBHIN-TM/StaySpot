import { api } from './client';
import type { Property, RoommatePost, Conversation, Message, User, AppNotification } from '../types';

// ─── Auth ───────────────────────────────────────────────────────────────────
export const AuthApi = {
  register: (body: {
    email: string; password: string; name: string; role?: string;
    gender?: string; occupation?: string; mobile_number?: string;
  }) => api.post<{ token: string; user: User }>('/auth/register', body).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }).then((r) => r.data),

  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};

// ─── Users ──────────────────────────────────────────────────────────────────
export const UserApi = {
  update: (body: Partial<Pick<User, 'name' | 'gender' | 'occupation' | 'mobile_number'>>) =>
    api.patch<{ user: User }>('/users/me', body).then((r) => r.data.user),

  uploadAvatar: (form: FormData) =>
    api
      .post<{ user: User }>('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.user),
};

// ─── Properties ─────────────────────────────────────────────────────────────
export interface PropertyFilters {
  q?: string; city?: string; property_type?: string;
  min_rent?: number; max_rent?: number;
  lat?: number; lng?: number; radius_km?: number;
  owner_id?: string; page?: number; limit?: number;
}

export const PropertyApi = {
  list: (filters: PropertyFilters = {}) =>
    api.get<{ properties: Property[] }>('/properties', { params: filters }).then((r) => r.data.properties),

  get: (id: string) => api.get<{ property: Property }>(`/properties/${id}`).then((r) => r.data.property),

  create: (body: Partial<Property>) =>
    api.post<{ property: Property }>('/properties', body).then((r) => r.data.property),

  update: (id: string, body: Partial<Property>) =>
    api.patch<{ property: Property }>(`/properties/${id}`, body).then((r) => r.data.property),

  remove: (id: string) => api.delete(`/properties/${id}`).then((r) => r.data),

  uploadImages: (id: string, form: FormData) =>
    api
      .post(`/properties/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
};

// ─── Roommate posts ─────────────────────────────────────────────────────────
export const RoommateApi = {
  list: (params: { q?: string; location?: string } = {}) =>
    api.get<{ posts: RoommatePost[] }>('/roommate-posts', { params }).then((r) => r.data.posts),

  get: (id: string) => api.get<{ post: RoommatePost }>(`/roommate-posts/${id}`).then((r) => r.data.post),

  create: (body: Partial<RoommatePost>) =>
    api.post<{ post: RoommatePost }>('/roommate-posts', body).then((r) => r.data.post),
};

// ─── Favorites ──────────────────────────────────────────────────────────────
export const FavoriteApi = {
  list: () => api.get<{ properties: Property[] }>('/favorites').then((r) => r.data.properties),
  add: (propertyId: string) => api.post(`/favorites/${propertyId}`).then((r) => r.data),
  remove: (propertyId: string) => api.delete(`/favorites/${propertyId}`).then((r) => r.data),
};

// ─── Chat ───────────────────────────────────────────────────────────────────
export const ChatApi = {
  start: (other_user_id: string, property_id?: string | null) =>
    api
      .post<{ conversation_id: string }>('/chat/conversations', { other_user_id, property_id })
      .then((r) => r.data.conversation_id),

  conversations: () =>
    api.get<{ conversations: Conversation[] }>('/chat/conversations').then((r) => r.data.conversations),

  messages: (conversationId: string, before?: string) =>
    api
      .get<{ messages: Message[] }>(`/chat/conversations/${conversationId}/messages`, {
        params: { before },
      })
      .then((r) => r.data.messages),

  send: (conversationId: string, content: string) =>
    api
      .post<{ message: Message }>(`/chat/conversations/${conversationId}/messages`, { content })
      .then((r) => r.data.message),

  markRead: (conversationId: string) =>
    api.post(`/chat/conversations/${conversationId}/read`).then((r) => r.data),
};

// ─── Notifications ──────────────────────────────────────────────────────────
export const NotificationApi = {
  list: () =>
    api.get<{ notifications: AppNotification[]; unread_count: number }>('/notifications').then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
};
