import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { authApi } from './api'; // Will be imported after api creation

type ViteImportMeta = ImportMeta & { env?: Record<string, string | undefined> };
const env = ((import.meta as ViteImportMeta).env || {}) as Record<string, string | undefined>;

// ✅ FIXED: Proper API URL resolution
const BASE_URL = (() => {
  const configured = env.VITE_API_URL?.trim();
  if (configured) return configured;

  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';

  if (isLocalHost) {
    return '/api/v1'; // Use proxy in dev
  }

  // Production: use environment variable or ask for it
  const prodUrl = env.VITE_PROD_API_URL;
  if (!prodUrl) {
    console.warn('⚠️ VITE_PROD_API_URL not set, using fallback');
    return 'https://ca-portal-v2.onrender.com/api/v1';
  }

  return prodUrl;
})();

console.log(`📍 API Base URL: ${BASE_URL}`);

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ✅ Allow cookies
  timeout: 30000, // 30 second timeout
});

// ✅ REQUEST INTERCEPTOR: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error.message);
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR: Handle errors, refresh tokens, prevent 401 loop
api.interceptors.response.use(
  (res) => {
    // Reset error state on success
    return res;
  },
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message || 'Network error';

    // ✅ FIX: Don't auto-logout on first 401
    // Try to refresh token instead
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();

        if (!refreshToken) {
          // No refresh token, must logout
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(err);
        }

        console.log('🔄 Attempting token refresh...');

        // Create fresh axios instance to avoid recursion
        const freshApi = axios.create({
          baseURL: BASE_URL,
          timeout: 10000,
        });

        const refreshRes = await freshApi.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token } = refreshRes.data;
        const { user } = useAuthStore.getState();

        // Update token in store (expiresIn = 1 hour by default)
        useAuthStore.getState().setAuth(user!, access_token, refreshToken, 3600);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // ✅ FIX: Only logout on actual auth failure, not all 401s
    if (status === 401 && originalRequest._retry) {
      // Already tried refresh, must logout
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    // Handle network errors gracefully
    if (!err.response) {
      console.error('❌ Network error - no response from server');
      toast.error('Network error. Check your connection.');
      return Promise.reject(err);
    }

    // Log errors
    console.error(`❌ API Error [${status}]:`, message);

    // Show user-friendly error
    const errorMsg = Array.isArray(message) ? message[0] : message;
    if (status !== 401) { // Don't show toast for 401 (already handled)
      toast.error(errorMsg || 'Something went wrong');
    }

    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  sendOtp: (phone: string) =>
    api.post('/auth/otp/send', { phone }).then(r => r.data),
  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/otp/verify', { phone, otp }).then(r => r.data),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }).then(r => r.data),
  getProfile: () => api.get('/auth/profile').then(r => r.data),
};

// ─── Tasks ────────────────────────────────────────────────
export const tasksApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/tasks', { params }).then(r => r.data),
  getOne: (id: string) => api.get(`/tasks/${id}`).then(r => r.data),
  getStats: () => api.get('/tasks/stats').then(r => r.data),
  getHistory: (id: string) => api.get(`/tasks/${id}/history`).then(r => r.data),
  create: (data: any) => api.post('/tasks', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data).then(r => r.data),
  approve: (id: string) => api.patch(`/tasks/${id}/approve`).then(r => r.data),
  reject: (id: string, remarks: string) =>
    api.patch(`/tasks/${id}/reject`, { remarks }).then(r => r.data),
  bulkApprove: (ids: string[]) => api.post('/tasks/bulk-approve', { ids }).then(r => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`).then(r => r.data),
};

// ─── Clients ──────────────────────────────────────────────
export const clientsApi = {
  getAll: (search?: string) =>
    api.get('/clients', { params: search ? { search } : {} }).then(r => r.data),
  getOne: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  getStats: () => api.get('/clients/stats').then(r => r.data),
  create: (data: any) => api.post('/clients', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then(r => r.data),
  addRegistration: (id: string, data: any) =>
    api.post(`/clients/${id}/registrations`, data).then(r => r.data),
  recalcHealth: (id: string) =>
    api.post(`/clients/${id}/health-score`).then(r => r.data),
};

// ─── Teams ────────────────────────────────────────────────
export const teamsApi = {
  getAll: () => api.get('/teams').then(r => r.data),
  create: (data: any) => api.post('/teams', data).then(r => r.data),
  addMember: (teamId: string, userId: string) =>
    api.post(`/teams/${teamId}/members`, { user_id: userId }).then(r => r.data),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`).then(r => r.data),
  delete: (id: string) => api.delete(`/teams/${id}`).then(r => r.data),
};

// ─── Timesheets ───────────────────────────────────────────
export const timesheetsApi = {
  getEntries: (params?: Record<string, string>) =>
    api.get('/timesheets', { params }).then(r => r.data),
  getWeekly: () => api.get('/timesheets/weekly').then(r => r.data),
  create: (data: any) => api.post('/timesheets', data).then(r => r.data),
  delete: (id: string) => api.delete(`/timesheets/${id}`).then(r => r.data),
};

// ─── Billing ──────────────────────────────────────────────
export const billingApi = {
  getInvoices: (params?: Record<string, string>) =>
    api.get('/billing/invoices', { params }).then(r => r.data),
  getOutstanding: () => api.get('/billing/outstanding').then(r => r.data),
  create: (data: any) => api.post('/billing/invoices', data).then(r => r.data),
  updateStatus: (id: string, status: string, ref?: string) =>
    api.patch(`/billing/invoices/${id}/status`, { status, payment_reference: ref }).then(r => r.data),
};

// ─── Analytics ────────────────────────────────────────────
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview').then(r => r.data),
  getStaffUtil: () => api.get('/analytics/staff-utilisation').then(r => r.data),
};

// ─── Notifications ────────────────────────────────────────
export const notificationsApi = {
  getUnread: () => api.get('/notifications').then(r => r.data),
  markRead: (ids: string[]) => api.patch('/notifications/read', { ids }).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
};

// ─── Announcements ────────────────────────────────────────
export const announcementsApi = {
  getAll: () => api.get('/announcements').then(r => r.data),
  create: (data: any) => api.post('/announcements', data).then(r => r.data),
  delete: (id: string) => api.delete(`/announcements/${id}`).then(r => r.data),
};

// ─── Compliance ───────────────────────────────────────────
export const complianceApi = {
  getCalendar: (params?: Record<string, string>) =>
    api.get('/compliance/calendar', { params }).then(r => r.data),
  getSchedules: () => api.get('/compliance/schedules').then(r => r.data),
  createSchedule: (data: any) => api.post('/compliance/schedules', data).then(r => r.data),
};

// ─── Users ────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users').then(r => r.data),
  getCapacity: () => api.get('/users/capacity').then(r => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
};
