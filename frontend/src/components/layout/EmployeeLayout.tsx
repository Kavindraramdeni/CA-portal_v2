import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Clock, ShieldCheck, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const EMP_NAV = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'My Tasks',  path: '/employee/my-tasks',  icon: ListTodo },
  { label: 'Timesheet', path: '/employee/timesheet', icon: Clock },
];

const EmployeeLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      <aside className="hidden md:flex flex-col w-60 bg-surface-1 border-r border-border flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">CA Portal</p>
            <p className="text-xs text-text-muted">Employee</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {EMP_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(isActive ? 'nav-item-active' : 'nav-item')}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand-glow text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-text-muted hover:text-danger p-1">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-surface-1 border-b border-border flex items-center px-6">
          <h2 className="text-base font-semibold text-text-primary">Welcome back, {user?.name?.split(' ')[0]}</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
