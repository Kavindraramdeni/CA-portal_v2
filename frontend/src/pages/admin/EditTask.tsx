import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Trash2, Loader2, X } from 'lucide-react';
import { tasksApi, clientsApi, usersApi, teamsApi } from '../../services/api';
import { COMPLIANCE_LABELS, STATUS_LABELS } from '../../types';
import { PageLoader, SectionHeader, ErrorAlert } from '../../components/ui';

export default function EditTask() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({});

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getOne(taskId!),
    enabled: !!taskId,
  });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title, description: task.description, compliance_type: task.compliance_type,
        priority: task.priority, status: task.status, due_date: task.due_date?.split('T')[0],
        target_date: task.target_date?.split('T')[0], fee_amount: task.fee_amount,
        estimated_hours: task.estimated_hours, notes: task.notes,
        work_type: task.work_type?.join(', '),
      });
      setAssignedTo(task.assigned_to || []);
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksApi.update(taskId!, { ...data, assigned_to: assignedTo, work_type: data.work_type?.split(',').map((s: string) => s.trim()).filter(Boolean) }),
    onSuccess: () => { toast.success('Task updated'); qc.invalidateQueries({ queryKey: ['tasks'] }); navigate('/admin/tasks'); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId!),
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries({ queryKey: ['tasks'] }); navigate('/admin/tasks'); },
  });

  if (isLoading) return <PageLoader />;
  if (!task) return <div className="text-danger text-center p-8">Task not found</div>;

  const inp = "input";
  const set = (k: string, v: any) => setFormData((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <SectionHeader title={`Edit: ${task.clients?.name}`} subtitle={task.title} />
      <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(formData); }} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-3">Task Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Title</label>
              <input className={inp} value={formData.title || ''} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
              <label className="label">Status</label>
              <select className={inp} value={formData.status || ''} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className={inp} value={formData.priority || 'medium'} onChange={e => set('priority', e.target.value)}>
                {['high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className={inp} value={formData.due_date || ''} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Target Date</label>
              <input type="date" className={inp} value={formData.target_date || ''} onChange={e => set('target_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Fee Amount (₹)</label>
              <input type="number" className={inp} value={formData.fee_amount || ''} onChange={e => set('fee_amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Billable Hours</label>
              <input type="number" step="0.5" className={inp} value={formData.estimated_hours || ''} onChange={e => set('estimated_hours', e.target.value)} />
            </div>
            <div>
              <label className="label">Acknowledgement No.</label>
              <input className={inp} value={formData.acknowledgement_number || ''} onChange={e => set('acknowledgement_number', e.target.value)} placeholder="ITR/GST ack number" />
            </div>
            <div>
              <label className="label">UDIN</label>
              <input className={inp} value={formData.udin || ''} onChange={e => set('udin', e.target.value)} placeholder="UDIN number" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea rows={3} className={inp} value={formData.notes || ''} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-3">Assigned Staff</h3>
          <div className="flex flex-wrap gap-2 min-h-[36px]">
            {assignedTo.map(id => {
              const u = users.find((u: any) => u.id === id);
              return (
                <span key={id} className="badge-brand flex items-center gap-1">
                  {u?.name || id}
                  <button type="button" onClick={() => setAssignedTo(prev => prev.filter(x => x !== id))}><X size={11} /></button>
                </span>
              );
            })}
          </div>
          <select className={inp} value="" onChange={e => { if (e.target.value && !assignedTo.includes(e.target.value)) setAssignedTo(p => [...p, e.target.value]); }}>
            <option value="">— Add employee —</option>
            {users.filter((u: any) => !assignedTo.includes(u.id)).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(); }} disabled={deleteMutation.isPending} className="btn-danger">
            {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
