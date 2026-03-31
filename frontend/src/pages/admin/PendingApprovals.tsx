import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Eye, History, Loader2 } from 'lucide-react';
import { tasksApi, usersApi } from '../../services/api';
import { TaskTable } from '../../components/ui/TaskTable';
import { Modal, SectionHeader, StatusBadge, PageLoader } from '../../components/ui';
import { format } from 'date-fns';
import type { Task } from '../../types';

export default function PendingApprovals() {
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; taskIds: string[] }>({ open: false, taskIds: [] });
  const [remarks, setRemarks] = useState('');
  const [historyModal, setHistoryModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll({}) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });

  const pendingTasks = tasks.filter((t: Task) => t.status === 'pending_approval');
  const completedTasks = tasks.filter((t: Task) => ['approved', 'completed'].includes(t.status));

  const { data: history } = useQuery({
    queryKey: ['task-history', historyModal.task?.id],
    queryFn: () => tasksApi.getHistory(historyModal.task!.id),
    enabled: !!historyModal.task,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => tasksApi.approve(id),
    onSuccess: () => { toast.success('Approved'); qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
  const bulkApproveMutation = useMutation({
    mutationFn: () => tasksApi.bulkApprove(selectedIds),
    onSuccess: () => { toast.success(`${selectedIds.length} tasks approved`); setSelectedIds([]); qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: any) => tasksApi.reject(id, remarks),
    onSuccess: () => { toast.success('Rejected'); setRejectModal({ open: false, taskIds: [] }); setRemarks(''); qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });

  const handleReject = () => {
    if (!remarks.trim()) { toast.error('Please provide rejection remarks'); return; }
    rejectModal.taskIds.forEach(id => rejectMutation.mutate({ id, remarks }));
  };

  const actions = (task: Task) => (
    <div className="flex gap-1.5 justify-end">
      <button onClick={() => setHistoryModal({ open: true, task })} className="btn-ghost btn-sm"><History size={13} /></button>
      <button onClick={() => approveMutation.mutate(task.id)} className="btn-sm bg-success/10 text-success border border-success/20 hover:bg-success/20">
        {approveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
      </button>
      <button onClick={() => setRejectModal({ open: true, taskIds: [task.id] })} className="btn-danger btn-sm">
        <X size={13} /> Reject
      </button>
    </div>
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Pending Approvals" subtitle={`${pendingTasks.length} tasks awaiting review`} />

      {selectedIds.length > 0 && (
        <div className="card p-4 flex items-center justify-between border-brand/30 bg-brand/5">
          <span className="text-sm text-brand-glow font-medium">{selectedIds.length} task(s) selected</span>
          <div className="flex gap-2">
            <button onClick={() => bulkApproveMutation.mutate()} disabled={bulkApproveMutation.isPending} className="btn-sm bg-success/10 text-success border border-success/20">
              {bulkApproveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Bulk Approve
            </button>
            <button onClick={() => setRejectModal({ open: true, taskIds: selectedIds })} className="btn-danger btn-sm"><X size={13} /> Bulk Reject</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-5 border-b border-border"><h3 className="font-semibold text-text-primary">Awaiting Approval ({pendingTasks.length})</h3></div>
        <TaskTable tasks={pendingTasks} users={users} renderActions={actions} selectable selectedIds={selectedIds}
          onSelect={id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === pendingTasks.length ? [] : pendingTasks.map((t: Task) => t.id))}
        />
      </div>

      <div className="card">
        <div className="p-5 border-b border-border"><h3 className="font-semibold text-text-primary">Completed & Approved ({completedTasks.length})</h3></div>
        <TaskTable tasks={completedTasks} users={users}
          renderActions={t => (
            <button onClick={() => setHistoryModal({ open: true, task: t })} className="btn-ghost btn-sm"><History size={13} /> History</button>
          )} />
      </div>

      {/* Reject modal */}
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, taskIds: [] })}
        title={`Reject ${rejectModal.taskIds.length} task(s)`}
        footer={<>
          <button onClick={() => setRejectModal({ open: false, taskIds: [] })} className="btn-secondary">Cancel</button>
          <button onClick={handleReject} disabled={rejectMutation.isPending} className="btn-danger">
            {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null} Submit Rejection
          </button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-text-secondary text-sm">Provide a reason visible to the employee:</p>
          <textarea rows={4} className="input" placeholder="e.g. Please revise section 3..." value={remarks} onChange={e => setRemarks(e.target.value)} autoFocus />
        </div>
      </Modal>

      {/* History modal */}
      <Modal isOpen={historyModal.open} onClose={() => setHistoryModal({ open: false, task: null })}
        title={`History: ${historyModal.task?.title}`} size="lg">
        <div className="space-y-3">
          {!history?.length && <p className="text-text-muted text-center py-8">No history found</p>}
          {history?.map((h: any) => (
            <div key={h.id} className="flex gap-3 p-3 rounded-lg bg-surface-0 border border-border">
              <div className="w-2 h-2 rounded-full bg-brand mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-primary">
                  Status → <StatusBadge status={h.to_status} />
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  by {h.users?.name || 'System'} · {format(new Date(h.created_at), 'dd MMM yyyy HH:mm')}
                </p>
                {h.remarks && <p className="text-xs text-danger mt-1 italic">"{h.remarks}"</p>}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
