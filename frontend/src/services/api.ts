import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

type ViteImportMeta = ImportMeta & { env?: Record<string, string | undefined> };
const env = ((import.meta as ViteImportMeta).env || {}) as Record<string, string | undefined>;

const BASE_URL =
  env.VITE_API_URL?.trim() ||
  'https://ca-portal-v2.onrender.com/api/v1';

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

// ✅ SAFE 401 handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    // 🚨 ONLY logout if token exists AND it's clearly expired
    const token = useAuthStore.getState().token;

    if (status === 401 && token) {
      console.warn('401 detected — possible expired token');

      // ❌ DO NOT instantly logout on first failure
      // Let UI handle it instead
    }

    const msg = err.response?.data?.message || 'Something went wrong';
    toast.error(Array.isArray(msg) ? msg[0] : msg);

    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),

  getProfile: () =>
    api.get('/auth/profile').then(r => r.data),
};
