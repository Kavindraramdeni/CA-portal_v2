import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Upload, History, Eye, Clock, CheckCircle, ListTodo, Briefcase, Plus, Loader2, X } from 'lucide-react';
import { tasksApi, announcementsApi, timesheetsApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { STATUS_LABELS, STATUS_COLORS, type Task } from '../../types';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── Employee Dashboard ────────────────────────────────────────────────────────
export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ['task-stats'], queryFn: tasksApi.getStats });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() });
  const { data: announcements = [] } = useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.getAll });

  const myTasks = (tasks as Task[]).filter(t => t.assigned_to?.includes(user?.id || ''));
  const urgent = myTasks.filter(t => ['yet_to_start','in_progress'].includes(t.status))
    .sort((a,b) => new Date(a.due_date).getTime()-new Date(b.due_date).getTime()).slice(0,5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">{format(new Date(),'EEEE, dd MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Assigned', value: stats?.assigned||myTasks.length, icon: Briefcase, color:'bg-brand' },
          { label:'Pending', value: stats?.pending||0, icon: Clock, color:'bg-warning' },
          { label:'Completed', value: stats?.completed||0, icon: CheckCircle, color:'bg-success' },
          { label:'Due This Week', value: stats?.due_this_week||0, icon: ListTodo, color:'bg-info' },
        ].map(({label,value,icon:Icon,color}) => (
          <div key={label} className="stat-card">
            <div><p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{value}</p></div>
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}><Icon size={20} className="text-white"/></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-text-primary">Urgent Tasks</h3>
            <Link to="/employee/my-tasks" className="text-xs text-brand-glow hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border/50">
            {urgent.map(t => {
              const overdue = isPast(new Date(t.due_date));
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-2/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{t.clients?.name}</p>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{t.title}</p>
                    <p className={clsx('text-xs mt-0.5', overdue ? 'text-danger' : 'text-text-muted')}>
                      Due: {format(new Date(t.due_date),'dd MMM yyyy')}{overdue ? ' (Overdue!)' : ''}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[t.status]} ml-3 flex-shrink-0`}>{STATUS_LABELS[t.status]}</span>
                </div>
              );
            })}
            {urgent.length === 0 && <p className="text-center text-text-muted text-sm py-10">No urgent tasks 🎉</p>}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-text-primary">Announcements</h3>
          </div>
          <div className="divide-y divide-border/50">
            {(announcements as any[]).slice(0,4).map(ann => (
              <div key={ann.id} className="px-5 py-3">
                <p className="text-sm font-medium text-text-primary">{ann.title}</p>
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{ann.content}</p>
                <p className="text-xs text-text-muted mt-1">{format(new Date(ann.created_at),'dd MMM yyyy')}</p>
              </div>
            ))}
            {(announcements as any[]).length === 0 && <p className="text-center text-text-muted text-sm py-8">No announcements</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── My Tasks ─────────────────────────────────────────────────────────────────
export const MyTasks: React.FC = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pending'|'completed'>('pending');
  const [submitTask, setSubmitTask] = useState<Task|null>(null);
  const [files, setFiles] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() });
  const myTasks = (tasks as Task[]).filter(t => t.assigned_to?.includes(user?.id||''));
  const pending = myTasks.filter(t => ['yet_to_start','in_progress','documents_requested','in_preparation'].includes(t.status));
  const completed = myTasks.filter(t => ['pending_approval','approved','completed','filed'].includes(t.status));
  const display = tab==='pending' ? pending : completed;

  const submitMutation = useMutation({
    mutationFn: () => tasksApi.update(submitTask!.id, {
      status: 'pending_approval',
      remarks,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['tasks'] }); setSubmitTask(null); setRemarks(''); toast.success('Work submitted for approval!'); },
  });

  return (
    <>
      <div className="space-y-5">
        <div><h1 className="page-title">My Tasks</h1></div>
        <div className="border-b border-border flex gap-6">
          {(['pending','completed'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab===t?'border-brand text-brand-glow':'border-transparent text-text-muted hover:text-text-secondary'}`}>
              {t === 'pending' ? `Pending (${pending.length})` : `Completed (${completed.length})`}
            </button>
          ))}
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2/50">
                <tr><th className="th">Client / Task</th><th className="th">Priority</th><th className="th">Due Date</th><th className="th">Status</th><th className="th text-right">Actions</th></tr>
              </thead>
              <tbody>
                {display.map(t => {
                  const overdue = isPast(new Date(t.due_date)) && tab==='pending';
                  return (
                    <tr key={t.id} className={clsx('table-row', overdue && 'bg-danger/5')}>
                      <td className="td">
                        <p className="font-medium text-text-primary">{t.clients?.name}</p>
                        <p className="text-xs text-text-muted mt-0.5 max-w-[200px] truncate">{t.title}</p>
                      </td>
                      <td className="td"><span className={`text-xs font-semibold capitalize ${t.priority==='high'?'text-danger':t.priority==='medium'?'text-warning':'text-success'}`}>{t.priority}</span></td>
                      <td className="td text-xs text-text-secondary">{format(new Date(t.due_date),'dd MMM yyyy')}</td>
                      <td className="td"><span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span></td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          {tab==='pending' && t.status !== 'pending_approval' && (
                            <button onClick={() => setSubmitTask(t)} className="btn-sm btn-primary">
                              <Upload size={12}/> Submit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {display.length===0 && <tr><td colSpan={5} className="text-center text-text-muted py-10 text-sm">No tasks here</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {submitTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-elevated w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">Submit Work</h3>
              <button onClick={() => setSubmitTask(null)}><X size={16} className="text-text-muted"/></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-secondary">Task: <span className="text-text-primary font-medium">{submitTask.title}</span></p>
              <div>
                <label className="label">Remarks / Notes</label>
                <textarea rows={4} className="input resize-none" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Describe what you completed..."/>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button onClick={() => setSubmitTask(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="btn-primary">
                {submitMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>} Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── My Timesheet ─────────────────────────────────────────────────────────────
export const MyTimesheet: React.FC = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskId, setTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');

  const { data: entries = [] } = useQuery({
    queryKey: ['my-timesheets'], queryFn: () => timesheetsApi.getEntries({ user_id: user?.id||'' }),
  });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() });
  const myTasks = (tasks as any[]).filter(t => t.assigned_to?.includes(user?.id||''));

  const createMutation = useMutation({
    mutationFn: () => timesheetsApi.create({ date, task_id: taskId||undefined, hours: parseFloat(hours), description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['my-timesheets'] }); setHours(''); setDescription(''); toast.success('Time logged'); },
  });

  const totalHours = (entries as any[]).reduce((s,e) => s+e.hours, 0);

  return (
    <div className="space-y-5">
      <div><h1 className="page-title">My Timesheet</h1></div>
      <div className="stat-card card">
        <div><p className="text-xs text-text-muted uppercase tracking-wider">Total Hours Logged</p>
        <p className="text-3xl font-bold text-text-primary mt-1">{totalHours.toFixed(1)}</p></div>
        <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center"><Clock size={20} className="text-white"/></div>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Log Time</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <div><label className="label">Date</label><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)}/></div>
          <div><label className="label">Task</label>
            <select className="input" value={taskId} onChange={e => setTaskId(e.target.value)}>
              <option value="">No task</option>
              {myTasks.map((t:any) => <option key={t.id} value={t.id}>{t.clients?.name} — {t.title.slice(0,25)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Work done..."/></div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="label">Hours</label>
              <input type="number" step="0.5" min="0.5" className="input" value={hours} onChange={e => setHours(e.target.value)} placeholder="2.5"/></div>
            <button onClick={() => createMutation.mutate()} disabled={!hours||!description||createMutation.isPending} className="btn-primary h-10 px-3">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
            </button>
          </div>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2/50">
              <tr><th className="th">Date</th><th className="th">Task</th><th className="th">Description</th><th className="th text-right">Hours</th></tr>
            </thead>
            <tbody>
              {(entries as any[]).map(e => (
                <tr key={e.id} className="table-row">
                  <td className="td text-xs text-text-secondary">{format(new Date(e.date),'dd MMM yyyy')}</td>
                  <td className="td text-xs text-text-muted">{e.tasks?.clients?.name||'—'}</td>
                  <td className="td text-sm max-w-[200px] truncate">{e.description}</td>
                  <td className="td text-right font-bold text-brand-glow">{e.hours.toFixed(1)}</td>
                </tr>
              ))}
              {(entries as any[]).length===0 && <tr><td colSpan={4} className="text-center text-text-muted py-10 text-sm">No entries yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
