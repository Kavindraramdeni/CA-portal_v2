import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit, Trash2, History, Eye, Filter,
  ChevronDown, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { tasksApi, usersApi } from '../../services/api';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, COMPLIANCE_LABELS, type Task, type TaskStatus } from '../../types';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import TaskHistoryModal from '../../components/modals/TaskHistoryModal';

const STATUSES: TaskStatus[] = [
  'yet_to_start','in_progress','documents_requested','documents_received',
  'in_preparation','partner_review','pending_approval','approved','completed','filed'
];

const TaskManagement: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [historyTask, setHistoryTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted'); },
  });

  const filtered = useMemo(() => {
    return (tasks as Task[]).filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.clients?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const getUserName = (id: string) => (users as any[]).find(u => u.id === id)?.name || id.slice(0, 6);

  const handleDelete = (id: string) => {
    if (confirm('Delete this task? This cannot be undone.')) deleteMutation.mutate(id);
  };

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Task Management</h1>
            <p className="page-subtitle">{filtered.length} tasks</p>
          </div>
          <Link to="/admin/tasks/create" className="btn-primary">
            <Plus size={16} /> Create Task
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Search by client or task title..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <select className="input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2/50">
                <tr>
                  <th className="th">Client / Task</th>
                  <th className="th">Compliance</th>
                  <th className="th">Priority</th>
                  <th className="th">Due Date</th>
                  <th className="th">Status</th>
                  <th className="th">Assigned To</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="td"><div className="h-4 bg-surface-3 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-text-muted py-12 text-sm">No tasks found</td></tr>
                ) : (
                  filtered.map((task: Task) => {
                    const overdue = isPast(new Date(task.due_date)) && !['completed','approved','filed'].includes(task.status);
                    return (
                      <tr key={task.id} className={clsx('table-row', overdue && 'bg-danger/5')}>
                        <td className="td">
                          <div>
                            <div className="flex items-center gap-1.5">
                              {task.risk_score >= 70 && <AlertTriangle size={12} className="text-danger flex-shrink-0" />}
                              <span className="font-medium text-text-primary text-sm">{task.clients?.name}</span>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">{task.title}</p>
                          </div>
                        </td>
                        <td className="td">
                          <span className="text-xs text-text-secondary">
                            {task.compliance_type ? COMPLIANCE_LABELS[task.compliance_type] || task.compliance_type : '—'}
                          </span>
                        </td>
                        <td className="td">
                          <span className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="td">
                          <span className={clsx('text-xs font-medium', overdue ? 'text-danger' : 'text-text-secondary')}>
                            {format(new Date(task.due_date), 'dd MMM yy')}
                            {overdue && <span className="ml-1">(Overdue)</span>}
                          </span>
                        </td>
                        <td className="td">
                          <span className={`badge ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                        </td>
                        <td className="td">
                          <div className="flex -space-x-2">
                            {(task.assigned_to || []).slice(0, 3).map((uid: string) => (
                              <div key={uid} title={getUserName(uid)}
                                className="w-7 h-7 rounded-full bg-brand/20 border-2 border-surface-1 flex items-center justify-center text-brand-glow text-xs font-bold">
                                {getUserName(uid).charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {(task.assigned_to || []).length > 3 && (
                              <div className="w-7 h-7 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-xs text-text-muted">
                                +{task.assigned_to.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="td">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setHistoryTask(task)}
                              className="p-1.5 rounded-md hover:bg-surface-3 text-text-muted hover:text-brand-glow transition-colors" title="History">
                              <History size={14} />
                            </button>
                            <Link to={`/admin/tasks/${task.id}/edit`}
                              className="p-1.5 rounded-md hover:bg-surface-3 text-text-muted hover:text-text-primary transition-colors" title="Edit">
                              <Edit size={14} />
                            </Link>
                            <button onClick={() => handleDelete(task.id)}
                              className="p-1.5 rounded-md hover:bg-danger/10 text-text-muted hover:text-danger transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {historyTask && (
        <TaskHistoryModal
          taskId={historyTask.id}
          taskTitle={historyTask.title}
          onClose={() => setHistoryTask(null)}
        />
      )}
    </>
  );
};

export default TaskManagement;
