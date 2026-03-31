import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ListTodo, Clock, AlertTriangle, Calendar, Users, ArrowRight, Zap } from 'lucide-react';
import { tasksApi, clientsApi, announcementsApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { StatCard, SkeletonCard, SectionHeader } from '../../components/ui';
import { TaskTable } from '../../components/ui/TaskTable';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['task-stats'], queryFn: tasksApi.getStats });
  const { data: tasks, isLoading: tasksLoading } = useQuery({ queryKey: ['tasks', 'recent'], queryFn: () => tasksApi.getAll({}) });
  const { data: clientStats } = useQuery({ queryKey: ['client-stats'], queryFn: clientsApi.getStats });
  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.getAll });

  const h = new Date().getHours();
  const greeting = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Good {greeting}, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · {user?.firm_name}
          </p>
        </div>
        <Link to="/admin/tasks/create" className="btn-primary"><Zap size={15} /> New Task</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <StatCard title="Total Tasks" value={stats?.total ?? 0} icon={<ListTodo size={20} className="text-white" />} color="bg-brand/20" />
          <StatCard title="Pending Approval" value={stats?.pending_approval ?? 0} icon={<Clock size={20} className="text-white" />} color="bg-warning/20" sub="Awaiting review" />
          <StatCard title="Overdue" value={stats?.overdue ?? 0} icon={<AlertTriangle size={20} className="text-white" />} color="bg-danger/20" />
          <StatCard title="Due This Week" value={stats?.due_this_week ?? 0} icon={<Calendar size={20} className="text-white" />} color="bg-success/20" />
        </>}
      </div>

      {clientStats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Healthy Clients', val: clientStats.healthy, color: 'text-success', bg: 'bg-success/10' },
            { label: 'At Risk', val: clientStats.at_risk, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Critical', val: clientStats.critical, color: 'text-danger', bg: 'bg-danger/10' },
          ].map(item => (
            <div key={item.label} className="card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bg}`}><Users size={18} className={item.color} /></div>
              <div>
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="font-bold text-text-primary">{item.val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-semibold text-text-primary">Recent Tasks</h3>
            <Link to="/admin/tasks" className="text-xs text-brand hover:text-brand-glow flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <TaskTable tasks={tasks?.slice(0, 8) || []} loading={tasksLoading}
            renderActions={task => (
              <Link to={`/admin/tasks/${task.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
            )} />
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-border"><h3 className="font-semibold text-text-primary text-sm">Announcements</h3></div>
            <div className="p-4 space-y-3">
              {!announcements?.length && <p className="text-text-muted text-xs text-center py-4">No announcements</p>}
              {announcements?.slice(0, 3).map((ann: any) => (
                <div key={ann.id} className="p-3 rounded-lg bg-surface-0 border border-border">
                  <p className="font-medium text-text-primary text-xs">{ann.title}</p>
                  <p className="text-text-muted text-xs mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
              <Link to="/admin/announcements" className="text-xs text-brand block text-center">Manage →</Link>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-1">
              {[
                { label: 'Pending Approvals', to: '/admin/approvals', badge: stats?.pending_approval },
                { label: 'Compliance Calendar', to: '/admin/compliance' },
                { label: 'Staff Utilisation', to: '/admin/analytics' },
                { label: 'Outstanding Invoices', to: '/admin/billing' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <span className="text-sm text-text-secondary">{l.label}</span>
                  <div className="flex items-center gap-2">
                    {l.badge > 0 && <span className="badge-warning text-xs">{l.badge}</span>}
                    <ArrowRight size={12} className="text-text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
