import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import TaskManagement from './pages/admin/TaskManagement';
import CreateTask from './pages/admin/CreateTask';
import EditTask from './pages/admin/EditTask';
import ClientManagement from './pages/admin/ClientManagement';
import ClientDetail from './pages/admin/ClientDetail';
import PendingApprovals from './pages/admin/PendingApprovals';
import TeamsPage from './pages/admin/Teams';
import AnnouncementsPage from './pages/admin/Announcements';
import AdminTimesheets from './pages/admin/Timesheets';
import AnalyticsPage from './pages/admin/Analytics';
import BillingPage from './pages/admin/Billing';
import ComplianceCalendar from './pages/admin/ComplianceCalendar';
import UsersPage from './pages/admin/Users';

// Employee pages
import EmployeeDashboard from './pages/employee/Dashboard';
import MyTasks from './pages/employee/MyTasks';
import MyTimesheet from './pages/employee/MyTimesheet';

const ADMIN_ROLES = ['admin', 'partner', 'manager', 'senior', 'junior', 'article'];

const ProtectedRoute: React.FC<{ roles?: string[] }> = ({ roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'client' ? '/client' : '/login'} replace />;
  }
  return <Outlet />;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'client') return <Navigate to="/client/dashboard" replace />;
  if (['admin','partner', 'manager'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin / Staff routes */}
      <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="tasks/create" element={<CreateTask />} />
          <Route path="tasks/:taskId/edit" element={<EditTask />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="clients/:clientId" element={<ClientDetail />} />
          <Route path="approvals" element={<PendingApprovals />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="timesheets" element={<AdminTimesheets />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="compliance" element={<ComplianceCalendar />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>

      {/* Employee routes */}
      <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="timesheet" element={<MyTimesheet />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
