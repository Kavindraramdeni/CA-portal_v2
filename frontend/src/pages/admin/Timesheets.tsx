import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Clock } from 'lucide-react';
import { timesheetsApi, tasksApi, usersApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Timesheets: React.FC = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'mine'|'all'>('mine');
  const [filterUser, setFilterUser] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskId, setTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');

  const { data: entries = [] } = useQuery({
    queryKey: ['timesheets', tab, filterUser],
    queryFn: () => timesheetsApi.getEntries(tab==='mine' ? { user_id: user?.id || '' } : filterUser ? { user_id: filterUser } : {}),
  });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });

  const myTasks = (tasks as any[]).filter(t => t.assigned_to?.includes(user?.id));

  const createMutation = useMutation({
    mutationFn: () => timesheetsApi.create({ date, task_id: taskId || undefined, hours: parseFloat(hours), description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timesheets'] }); setHours(''); setDescription(''); setTaskId(''); toast.success('Time logged'); },
  });

  const weekTotal = (entries as any[])
    .filter(e => e.user_id === user?.id)
    .reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-5">
      <div><h1 className="page-title">Timesheets</h1><p className="page-subtitle">Track billable hours</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div><p className="text-xs text-text-muted uppercase tracking-wider">My Total Hours</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{weekTotal.toFixed(1)}</p></div>
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center"><Clock size={20} className="text-white"/></div>
        </div>
      </div>

      {/* Log time form */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Log Time</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <div><label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)}/></div>
          <div><label className="label">Task</label>
            <select className="input" value={taskId} onChange={e => setTaskId(e.target.value)}>
              <option value="">No task</option>
              {myTasks.map((t:any) => <option key={t.id} value={t.id}>{t.clients?.name} — {t.title.slice(0,30)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What did you work on?"/></div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="label">Hours</label>
              <input type="number" step="0.5" min="0.5" max="24" className="input" value={hours} onChange={e => setHours(e.target.value)} placeholder="2.5"/></div>
            <button onClick={() => createMutation.mutate()} disabled={!hours || !description || createMutation.isPending} className="btn-primary h-10 px-3">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6">
        {(['mine','all'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab===t?'border-brand text-brand-glow':'border-transparent text-text-muted hover:text-text-secondary'}`}>
            {t === 'mine' ? 'My Entries' : 'All Staff'}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <select className="input w-48" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          <option value="">All employees</option>
          {(users as any[]).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2/50">
              <tr>
                <th className="th">Date</th>
                {tab==='all' && <th className="th">Staff</th>}
                <th className="th">Task</th>
                <th className="th">Description</th>
                <th className="th text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {(entries as any[]).map(e => (
                <tr key={e.id} className="table-row">
                  <td className="td text-xs text-text-secondary">{format(new Date(e.date), 'dd MMM yyyy')}</td>
                  {tab==='all' && <td className="td text-sm font-medium">{e.users?.name || '—'}</td>}
                  <td className="td text-xs text-text-muted">{e.tasks?.clients?.name ? `${e.tasks.clients.name}` : '—'}</td>
                  <td className="td text-sm max-w-[200px] truncate" title={e.description}>{e.description}</td>
                  <td className="td text-right font-bold text-brand-glow">{e.hours.toFixed(1)}</td>
                </tr>
              ))}
              {(entries as any[]).length === 0 && (
                <tr><td colSpan={tab==='all'?5:4} className="text-center text-text-muted py-10 text-sm">No entries found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Timesheets;
