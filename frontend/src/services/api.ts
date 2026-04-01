import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

/* ─────────────────────────────────────────────────────────────
   Base URL Setup
───────────────────────────────────────────────────────────── */
type ViteImportMeta = ImportMeta & { env?: Record<string, string | undefined> };

const env = ((import.meta as ViteImportMeta).env || {}) as Record<string, string | undefined>;

const configuredBaseUrl = env.VITE_API_URL?.trim();

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalHost = host === 'localhost' || host === '127.0.0.1';

const BASE_URL =
  configuredBaseUrl ||
  (isLocalHost
    ? 'http://localhost:3001/api/v1'
    : 'https://ca-portal-v2.onrender.com/api/v1');

/* ─────────────────────────────────────────────────────────────
   Axios Instance
───────────────────────────────────────────────────────────── */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─────────────────────────────────────────────────────────────
   Request Interceptor (Attach Token)
───────────────────────────────────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ─────────────────────────────────────────────────────────────
   Response Interceptor (Handle Errors)
───────────────────────────────────────────────────────────── */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    // 🚨 Only logout if token exists (avoid loop)
    if (status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout();

      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.href = '/login';
      }
    }

    const msg =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong';

    if (msg !== 'Unauthorized') {
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }

    return Promise.reject(err);
  },
);

/* ─────────────────────────────────────────────────────────────
   AUTH API
───────────────────────────────────────────────────────────── */
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  sendOtp: (phone: string) =>
    api.post('/auth/otp/send', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/otp/verify', { phone, otp }).then((r) => r.data),

  getProfile: () =>
    api.get('/auth/profile').then((r) => r.data),
};

/* ─────────────────────────────────────────────────────────────
   USERS API
───────────────────────────────────────────────────────────── */
export const usersApi = {
  getAll: () => api.get('/users').then((r) => r.data),

  getCapacity: () =>
    api.get('/users/capacity').then((r) => r.data),

  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data).then((r) => r.data),
};

/* ─────────────────────────────────────────────────────────────
   TASKS API
───────────────────────────────────────────────────────────── */
export const tasksApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/tasks', { params }).then((r) => r.data),

  getOne: (id: string) =>
    api.get(`/tasks/${id}`).then((r) => r.data),

  getHistory: (id: string) =>
    api.get(`/tasks/${id}/history`).then((r) => r.data),

  create: (data: any) =>
    api.post('/tasks', data).then((r) => r.data),

  update: (id: string, data: any) =>
    api.put(`/tasks/${id}`, data).then((r) => r.data),

  approve: (id: string) =>
    api.patch(`/tasks/${id}/approve`).then((r) => r.data),

  reject: (id: string, remarks: string) =>
    api.patch(`/tasks/${id}/reject`, { remarks }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`).then((r) => r.data),
};

/* ─────────────────────────────────────────────────────────────
   CLIENTS API
───────────────────────────────────────────────────────────── */
export const clientsApi = {
  getAll: () =>
    api.get('/clients').then((r) => r.data),

  getOne: (id: string) =>
    api.get(`/clients/${id}`).then((r) => r.data),

  create: (data: any) =>
    api.post('/clients', data).then((r) => r.data),

  update: (id: string, data: any) =>
    api.put(`/clients/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/clients/${id}`).then((r) => r.data),
};

/* ─────────────────────────────────────────────────────────────
   TEAMS API
───────────────────────────────────────────────────────────── */
export const teamsApi = {
  getAll: () =>
    api.get('/teams').then((r) => r.data),

  create: (data: any) =>
    api.post('/teams', data).then((r) => r.data),
};

/* ─────────────────────────────────────────────────────────────
   NOTIFICATIONS API (🔥 FIXED EXPORT)
───────────────────────────────────────────────────────────── */
export const notificationsApi = {
  getAll: () =>
    api.get('/notifications').then((r) => r.data),

  markRead: (ids: string[]) =>
    api.patch('/notifications/read', { ids }).then((r) => r.data),

  markAllRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),
};

/* ─────────────────────────────────────────────────────────────
   ANALYTICS API
───────────────────────────────────────────────────────────── */
export const analyticsApi = {
  getOverview: () =>
    api.get('/analytics/overview').then((r) => r.data),
};
