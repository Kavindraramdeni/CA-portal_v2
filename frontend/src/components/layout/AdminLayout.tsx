import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, Users, ClipboardCheck, BarChart3,
  Megaphone, Clock, CreditCard, Calendar, ShieldCheck, LogOut,
  Bell, Search, ChevronDown, Menu, X, UserCog, Building2, Briefcase
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import clsx from 'clsx';

const ADMIN_NAV = [
  { label: 'Dashboard',    path: '/admin/dashboard',    icon: LayoutDashboard, roles: ['partner','manager','senior','junior','article'] },
  { label: 'Tasks',        path: '/admin/tasks',        icon: ListTodo,        roles: ['partner','manager','senior','junior','article'] },
  { label: 'Clients',      path: '/admin/clients',      icon: Building2,       roles: ['partner','manager','senior'] },
  { label: 'Approvals',    path: '/admin/approvals',    icon: ClipboardCheck,  roles: ['partner','manager'] },
  { label: 'Compliance',   path: '/admin/compliance',   icon: Calendar,        roles: ['partner','manager','senior'] },
  { label: 'Analytics',    path: '/admin/analytics',    icon: BarChart3,       roles: ['partner','manager'] },
  { label: 'Billing',      path: '/admin/billing',      icon: CreditCard,      roles: ['partner','manager'] },
  { label: 'Timesheets',   path: '/admin/timesheets',   icon: Clock,           roles: ['partner','manager','senior','junior','article'] },
  { label: 'Teams',        path: '/admin/teams',        icon: Users,           roles: ['partner','manager'] },
  { label: 'Staff',        path: '/admin/users',        icon: UserCog,         roles: ['partner','manager'] },
  { label: 'Announcements',path: '/admin/announcements',icon: Megaphone,       roles: ['partner','manager'] },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getUnread,
    refetchInterval: 30_000,
  });

  const handleLogout = () => { logout(); navigate('/login'); };
  const visibleNav = ADMIN_NAV.filter(n => n.roles.includes(user?.role || ''));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary leading-none">CA Portal</p>
          <p className="text-xs text-text-muted mt-0.5">{user?.firm_name || 'Practice Management'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(isActive ? 'nav-item-active' : 'nav-item')
            }
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand-glow text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
            <p className="text-xs text-text-muted capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors p-1">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-surface-1 border-r border-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-border">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-surface-1 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-text-secondary hover:text-text-primary p-1"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search tasks, clients..."
                className="input pl-9 h-8 text-xs w-56 bg-surface-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 rounded-lg hover:bg-surface-3 transition-colors"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={18} className="text-text-secondary" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 card-elevated z-50 animate-slide-up max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button onClick={() => setNotifOpen(false)}><X size={14} className="text-text-muted" /></button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-center text-text-muted text-sm py-8">All caught up!</p>
                  ) : (
                    notifications.slice(0, 10).map((n: any) => (
                      <div key={n.id} className={clsx('px-4 py-3 border-b border-border/50 hover:bg-surface-3 cursor-pointer', !n.is_read && 'bg-brand/5')}>
                        <p className="text-xs font-medium text-text-primary">{n.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-3 transition-colors"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand-glow text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm text-text-primary font-medium">{user?.name}</span>
                <ChevronDown size={14} className="text-text-muted" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 card-elevated z-50 animate-slide-up py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                    <p className="text-xs text-text-muted capitalize">{user?.role} · {user?.firm_name}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
