import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

const BASE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? '/api/v1'
    : 'https://ca-portal-v2.onrender.com/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Handle errors WITHOUT auto logout on login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginCall = err.config?.url?.includes('/auth/login');

    if (err.response?.status === 401 && !isLoginCall) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    const msg = err.response?.data?.message || 'Something went wrong';
    toast.error(msg);

    return Promise.reject(err);
  }
);

// ─── AUTH ─────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),

  getProfile: () =>
    api.get('/auth/profile').then(r => r.data),
};

// ─── TASKS ─────────────────
export const tasksApi = {
  getAll: () => api.get('/tasks').then(r => r.data),
  getStats: () => api.get('/tasks/stats').then(r => r.data),
};

// ─── CLIENTS ───────────────
export const clientsApi = {
  getAll: () => api.get('/clients').then(r => r.data),
};

// ─── ANNOUNCEMENTS ─────────
export const announcementsApi = {
  getAll: () => api.get('/announcements').then(r => r.data),
};

// ─── NOTIFICATIONS ─────────
export const notificationsApi = {
  getUnread: () => api.get('/notifications').then(r => r.data),
};

// ─── USERS ─────────────────
export const usersApi = {
  getCapacity: () => api.get('/users/capacity').then(r => r.data),
};
