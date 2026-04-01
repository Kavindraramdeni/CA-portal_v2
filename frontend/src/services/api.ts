import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

// ─── BASE URL ────────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/v1'
    : 'https://ca-portal-v2.onrender.com/api/v1');

// ─── AXIOS INSTANCE ─────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── REQUEST INTERCEPTOR (attach token) ─────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── RESPONSE INTERCEPTOR ───────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.log('🚨 401 → logging out');

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

// ─── AUTH ───────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),

  getProfile: () =>
    api.get('/auth/profile').then(r => r.data),

  sendOtp: (phone: string) =>
    api.post('/auth/otp/send', { phone }).then(r => r.data),

  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/otp/verify', { phone, otp }).then(r => r.data),
};

// ✅ IMPORTANT: THIS WAS MISSING → CAUSED BUILD ERROR
export const notificationsApi = {
  getUnread: () => api.get('/notifications').then(r => r.data),
  markRead: (ids: string[]) =>
    api.patch('/notifications/read', { ids }).then(r => r.data),
  markAllRead: () =>
    api.patch('/notifications/read-all').then(r => r.data),
};

// ─── USERS ──────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users').then(r => r.data),
  getCapacity: () => api.get('/users/capacity').then(r => r.data),
  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data).then(r => r.data),
};
