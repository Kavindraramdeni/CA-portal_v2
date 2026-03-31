import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, X, Loader2, ArrowLeft } from 'lucide-react';
import { tasksApi, clientsApi, usersApi, teamsApi } from '../../services/api';
import { COMPLIANCE_LABELS, type ComplianceType } from '../../types';
import toast from 'react-hot-toast';

const COMPLIANCE_TYPES = Object.entries(COMPLIANCE_LABELS) as [ComplianceType, string][];

interface TaskFormData {
  client_id: string; title: string; description: string;
  compliance_type: string; priority: string;
  due_date: string; target_date: string;
  period_from: string; period_to: string;
  assigned_to: string[]; assigned_team_id: string;
  fee_amount: string; estimated_hours: string;
  is_internal: boolean; is_recurring: boolean;
  notes: string; status: string;
}

const EMPTY: TaskFormData = {
  client_id: '', title: '', description: '', compliance_type: '',
  priority: 'medium', due_date: '', target_date: '',
  period_from: '', period_to: '', assigned_to: [],
  assigned_team_id: '', fee_amount: '', estimated_hours: '',
  is_internal: false, is_recurring: false, notes: '', status: 'yet_to_start',
};

const TaskForm: React.FC<{ mode: 'create' | 'edit'; taskId?: string }> = ({ mode, taskId }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<TaskFormData>(EMPTY);

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll });

  const { data: existingTask } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getOne(taskId!),
    enabled: mode === 'edit' && !!taskId,
  });

  useEffect(() => {
    if (existingTask) {
      setForm({
        client_id: existingTask.client_id || '',
        title: existingTask.title || '',
        description: existingTask.description || '',
        compliance_type: existingTask.compliance_type || '',
        priority: existingTask.priority || 'medium',
        due_date: existingTask.due_date?.split('T')[0] || '',
        target_date: existingTask.target_date?.split('T')[0] || '',
        period_from: existingTask.period_from?.split('T')[0] || '',
        period_to: existingTask.period_to?.split('T')[0] || '',
        assigned_to: existingTask.assigned_to || [],
        assigned_team_id: existingTask.assigned_team_id || '',
        fee_amount: existingTask.fee_amount?.toString() || '',
        estimated_hours: existingTask.estimated_hours?.toString() || '',
        is_internal: existingTask.is_internal || false,
        is_recurring: existingTask.is_recurring || false,
        notes: existingTask.notes || '',
        status: existingTask.status || 'yet_to_start',
      });
    }
  }, [existingTask]);

  const mutation = useMutation({
    mutationFn: (data: any) => mode === 'create' ? tasksApi.create(data) : tasksApi.update(taskId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(mode === 'create' ? 'Task created!' : 'Task updated!');
      navigate('/admin/tasks');
    },
  });

  const set = (key: keyof TaskFormData, val: any) => setForm(p => ({ ...p, [key]: val }));

  const addAssignee = (uid: string) => {
    if (uid && !form.assigned_to.includes(uid)) set('assigned_to', [...form.assigned_to, uid]);
  };
  const removeAssignee = (uid: string) => set('assigned_to', form.assigned_to.filter(id => id !== uid));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) { toast.error('Please select a client'); return; }
    if (!form.due_date) { toast.error('Due date is required'); return; }
    if (form.assigned_to.length === 0 && !form.assigned_team_id) {
      toast.error('Please assign to at least one person or team'); return;
    }
    mutation.mutate({
      ...form,
      fee_amount: form.fee_amount ? parseFloat(form.fee_amount) : undefined,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
      compliance_type: form.compliance_type || undefined,
      assigned_team_id: form.assigned_team_id || undefined,
    });
  };

  const availableUsers = (users as any[]).filter(u => !form.assigned_to.includes(u.id));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">{mode === 'create' ? 'Create New Task' : 'Edit Task'}</h1>
          <p className="page-subtitle">{mode === 'create' ? 'Fill in the task details below' : 'Update task information'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client & Compliance */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Task Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <select className="input" value={form.client_id} onChange={e => set('client_id', e.target.value)} required>
                <option value="">Select client...</option>
                {(clients as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Compliance Type</label>
              <select className="input" value={form.compliance_type} onChange={e => set('compliance_type', e.target.value)}>
                <option value="">Select type...</option>
                {COMPLIANCE_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Task Title *</label>
              <input type="text" className="input" value={form.title}
                onChange={e => set('title', e.target.value)} required placeholder="e.g. GSTR-3B October 2025 — Acme Corp" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea rows={3} className="input resize-none" value={form.description}
                onChange={e => set('description', e.target.value)} placeholder="Additional context..." />
            </div>
          </div>
        </div>

        {/* Dates & Priority */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Scheduling</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            {mode === 'edit' && (
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {['yet_to_start','in_progress','documents_requested','documents_received',
                    'in_preparation','internal_review','partner_review','ready_to_file',
                    'filed','completed','approved'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">Due Date *</label>
              <input type="date" className="input" value={form.due_date}
                onChange={e => set('due_date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Target Date</label>
              <input type="date" className="input" value={form.target_date}
                onChange={e => set('target_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Period From</label>
              <input type="date" className="input" value={form.period_from}
                onChange={e => set('period_from', e.target.value)} />
            </div>
            <div>
              <label className="label">Period To</label>
              <input type="date" className="input" value={form.period_to}
                onChange={e => set('period_to', e.target.value)} />
            </div>
            <div>
              <label className="label">Fee Amount (₹)</label>
              <input type="number" className="input" value={form.fee_amount}
                onChange={e => set('fee_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Est. Hours</label>
              <input type="number" step="0.5" className="input" value={form.estimated_hours}
                onChange={e => set('estimated_hours', e.target.value)} placeholder="0.0" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_internal} onChange={e => set('is_internal', e.target.checked)}
                className="rounded bg-surface-2 border-border text-brand" />
              <span className="text-sm text-text-secondary">Internal task</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_recurring} onChange={e => set('is_recurring', e.target.checked)}
                className="rounded bg-surface-2 border-border text-brand" />
              <span className="text-sm text-text-secondary">Recurring</span>
            </label>
          </div>
        </div>

        {/* Assignment */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Assign to Staff</label>
              <select className="input" onChange={e => { addAssignee(e.target.value); e.target.value = ''; }} defaultValue="">
                <option value="" disabled>Add staff member...</option>
                {availableUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.assigned_to.map(uid => {
                  const u = (users as any[]).find(u => u.id === uid);
                  return (
                    <span key={uid} className="badge badge-brand gap-1">
                      {u?.name || uid.slice(0, 8)}
                      <button type="button" onClick={() => removeAssignee(uid)}><X size={11} /></button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">Or Assign to Team</label>
              <select className="input" value={form.assigned_team_id} onChange={e => set('assigned_team_id', e.target.value)}>
                <option value="">No team</option>
                {(teams as any[]).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="label">Internal Notes</label>
          <textarea rows={3} className="input resize-none" value={form.notes}
            onChange={e => set('notes', e.target.value)} placeholder="Notes visible only to staff..." />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : mode === 'create' ? <Plus size={16} /> : <Save size={16} />}
            {mode === 'create' ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const CreateTask: React.FC = () => <TaskForm mode="create" />;

export const EditTask: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  return <TaskForm mode="edit" taskId={taskId} />;
};

export default CreateTask;
