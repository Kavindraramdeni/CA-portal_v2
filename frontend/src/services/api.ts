import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalHost = host === 'localhost' || host === '127.0.0.1';
const BASE_URL = isLocalHost ? '/api/v1' : 'https://ca-portal-v2.onrender.com/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — auto logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const msg = err.response?.data?.message || 'Something went wrong';
    toast.error(Array.isArray(msg) ? msg[0] : msg);
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  sendOtp: (phone: string) =>
    api.post('/auth/otp/send', { phone }).then(r => r.data),
  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/otp/verify', { phone, otp }).then(r => r.data),
  getProfile: () => api.get('/auth/profile').then(r => r.data),
};

// ─── Tasks ────────────────────────────────────────────────────
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

// ─── Clients ──────────────────────────────────────────────────
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

// ─── Teams ────────────────────────────────────────────────────
export const teamsApi = {
  getAll: () => api.get('/teams').then(r => r.data),
  create: (data: any) => api.post('/teams', data).then(r => r.data),
  addMember: (teamId: string, userId: string) =>
    api.post(`/teams/${teamId}/members`, { user_id: userId }).then(r => r.data),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`).then(r => r.data),
  delete: (id: string) => api.delete(`/teams/${id}`).then(r => r.data),
};

// ─── Timesheets ───────────────────────────────────────────────
export const timesheetsApi = {
  getEntries: (params?: Record<string, string>) =>
    api.get('/timesheets', { params }).then(r => r.data),
  getWeekly: () => api.get('/timesheets/weekly').then(r => r.data),
  create: (data: any) => api.post('/timesheets', data).then(r => r.data),
  delete: (id: string) => api.delete(`/timesheets/${id}`).then(r => r.data),
};

// ─── Billing ──────────────────────────────────────────────────
export const billingApi = {
  getInvoices: (params?: Record<string, string>) =>
    api.get('/billing/invoices', { params }).then(r => r.data),
  getOutstanding: () => api.get('/billing/outstanding').then(r => r.data),
  create: (data: any) => api.post('/billing/invoices', data).then(r => r.data),
  updateStatus: (id: string, status: string, ref?: string) =>
    api.patch(`/billing/invoices/${id}/status`, { status, payment_reference: ref }).then(r => r.data),
};

// ─── Analytics ────────────────────────────────────────────────
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview').then(r => r.data),
  getStaffUtil: () => api.get('/analytics/staff-utilisation').then(r => r.data),
};

// ─── Notifications ────────────────────────────────────────────
export const notificationsApi = {
  getUnread: () => api.get('/notifications').then(r => r.data),
  markRead: (ids: string[]) => api.patch('/notifications/read', { ids }).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
};

// ─── Announcements ────────────────────────────────────────────
export const announcementsApi = {
  getAll: () => api.get('/announcements').then(r => r.data),
  create: (data: any) => api.post('/announcements', data).then(r => r.data),
  delete: (id: string) => api.delete(`/announcements/${id}`).then(r => r.data),
};

// ─── Compliance ───────────────────────────────────────────────
export const complianceApi = {
  getCalendar: (params?: Record<string, string>) =>
    api.get('/compliance/calendar', { params }).then(r => r.data),
  getSchedules: () => api.get('/compliance/schedules').then(r => r.data),
  createSchedule: (data: any) => api.post('/compliance/schedules', data).then(r => r.data),
};

// ─── Users ────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users').then(r => r.data),
  getCapacity: () => api.get('/users/capacity').then(r => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
};
