import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

// ─── BASE URL ────────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? '/api/v1'
    : 'https://ca-portal-v2.onrender.com/api/v1');

// ─── AXIOS INSTANCE ──────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── REQUEST INTERCEPTOR (Attach JWT) ─────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── RESPONSE INTERCEPTOR (Handle 401) ────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.log('🚨 Unauthorized → logging out');

      useAuthStore.getState().logout();

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    const msg = err.response?.data?.message || 'Something went wrong';
    toast.error(Array.isArray(msg) ? msg[0] : msg);

    return Promise.reject(err);
  }
);

// ─── AUTH API ────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  sendOtp: async (phone: string) => {
    const res = await api.post('/auth/otp/send', { phone });
    return res.data;
  },

  verifyOtp: async (phone: string, otp: string) => {
    const res = await api.post('/auth/otp/verify', { phone, otp });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
};

// ─── TASKS ───────────────────────────────────────────────────
export const tasksApi = {
  getAll: () => api.get('/tasks').then(r => r.data),
  getStats: () => api.get('/tasks/stats').then(r => r.data),
  getOne: (id: string) => api.get(`/tasks/${id}`).then(r => r.data),
  getHistory: (id: string) => api.get(`/tasks/${id}/history`).then(r => r.data),
  create: (data: any) => api.post('/tasks', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`).then(r => r.data),
};

// ─── CLIENTS ─────────────────────────────────────────────────
export const clientsApi = {
  getAll: () => api.get('/clients').then(r => r.data),
  getStats: () => api.get('/clients/stats').then(r => r.data),
  getOne: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data: any) => api.post('/clients', data).then(r => r.data),
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────────
export const announcementsApi = {
  getAll: () => api.get('/announcements').then(r => r.data),
  create: (data: any) => api.post('/announcements', data).then(r => r.data),
  delete: (id: string) => api.delete(`/announcements/${id}`).then(r => r.data),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications').then(r => r.data),
  markRead: (ids: string[]) =>
    api.patch('/notifications/read', { ids }).then(r => r.data),
  markAllRead: () =>
    api.patch('/notifications/read-all').then(r => r.data),
};

// ─── USERS ───────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users').then(r => r.data),
  getCapacity: () => api.get('/users/capacity').then(r => r.data),
  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data).then(r => r.data),
};
