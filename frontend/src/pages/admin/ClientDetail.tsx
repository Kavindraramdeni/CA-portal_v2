import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Heart,
  CreditCard, ListTodo, Plus, FileText, AlertTriangle
} from 'lucide-react';
import { clientsApi } from '../../services/api';
import { STATUS_LABELS, STATUS_COLORS, type Task, type Invoice } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tasks'|'invoices'|'registrations'>('tasks');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getOne(clientId!),
    enabled: !!clientId,
  });

  const recalcMutation = useMutation({
    mutationFn: () => clientsApi.recalcHealth(clientId!),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      toast.success(`Health score updated: ${d.health_score}/100`);
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  if (!client) return <div className="text-center text-danger py-20">Client not found</div>;

  const healthColor = client.health_score >= 80 ? 'text-success' : client.health_score >= 50 ? 'text-warning' : 'text-danger';
  const healthBg = client.health_score >= 80 ? 'bg-success/10 border-success/20' : client.health_score >= 50 ? 'bg-warning/10 border-warning/20' : 'bg-danger/10 border-danger/20';

  const TABS = [
    { id: 'tasks', label: `Tasks (${client.tasks?.length || 0})` },
    { id: 'invoices', label: `Invoices (${client.invoices?.length || 0})` },
    { id: 'registrations', label: `Registrations (${client.client_registrations?.length || 0})` },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link to="/admin/clients" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="page-title">{client.name}</h1>
          {client.client_code && <p className="page-subtitle">Code: {client.client_code}</p>}
        </div>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main info */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-brand-glow" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-text-primary">{client.name}</h2>
              {client.group_name && <p className="text-sm text-text-muted">{client.group_name}</p>}
              {client.constitution && (
                <span className="badge badge-muted mt-1 capitalize">{client.constitution}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {client.pan && (
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-text-muted mb-1">PAN</p>
                <p className="font-mono font-medium text-text-primary">{client.pan}</p>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone size={14} className="text-text-muted flex-shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-text-secondary col-span-2">
                <Mail size={14} className="text-text-muted flex-shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {(client.city || client.state) && (
              <div className="flex items-center gap-2 text-text-secondary col-span-2">
                <MapPin size={14} className="text-text-muted flex-shrink-0" />
                <span>{[client.city, client.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Health & billing */}
        <div className="space-y-4">
          <div className={`card p-4 border ${healthBg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart size={16} className={healthColor} />
                <span className="text-sm font-semibold text-text-primary">Health Score</span>
              </div>
              <span className={`text-2xl font-bold ${healthColor}`}>{client.health_score}</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${client.health_score >= 80 ? 'bg-success' : client.health_score >= 50 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${client.health_score}%` }}
              />
            </div>
            <button onClick={() => recalcMutation.mutate()} className="mt-3 text-xs text-text-muted hover:text-text-secondary">
              Recalculate →
            </button>
          </div>

          {client.retainer_amount > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={15} className="text-text-muted" />
                <span className="text-sm font-semibold text-text-primary">Retainer</span>
              </div>
              <p className="text-xl font-bold text-text-primary">₹{client.retainer_balance?.toLocaleString()}</p>
              <p className="text-xs text-text-muted mt-0.5">of ₹{client.retainer_amount?.toLocaleString()} total</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-border">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-brand text-brand-glow'
                  : 'text-text-muted hover:text-text-secondary'
              }`}>
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <Link to={`/admin/tasks/create?client=${clientId}`}
            className="flex items-center gap-1.5 px-4 text-xs text-brand-glow hover:text-brand m-2">
            <Plus size={13} /> New Task
          </Link>
        </div>

        <div className="p-0">
          {activeTab === 'tasks' && (
            <table className="w-full">
              <thead className="bg-surface-2/50">
                <tr>
                  <th className="th">Task</th>
                  <th className="th">Due Date</th>
                  <th className="th">Status</th>
                  <th className="th">Priority</th>
                </tr>
              </thead>
              <tbody>
                {(client.tasks || []).length === 0
                  ? <tr><td colSpan={4} className="text-center text-text-muted py-10 text-sm">No tasks yet</td></tr>
                  : (client.tasks || []).map((t: Task) => (
                    <tr key={t.id} className="table-row">
                      <td className="td">
                        <Link to={`/admin/tasks/${t.id}/edit`} className="font-medium text-brand-glow hover:underline text-sm">{t.title}</Link>
                      </td>
                      <td className="td text-xs text-text-secondary">{format(new Date(t.due_date), 'dd MMM yyyy')}</td>
                      <td className="td"><span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span></td>
                      <td className="td capitalize text-xs text-text-secondary">{t.priority}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}

          {activeTab === 'invoices' && (
            <table className="w-full">
              <thead className="bg-surface-2/50">
                <tr>
                  <th className="th">Invoice #</th>
                  <th className="th">Date</th>
                  <th className="th">Amount</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {(client.invoices || []).length === 0
                  ? <tr><td colSpan={4} className="text-center text-text-muted py-10 text-sm">No invoices yet</td></tr>
                  : (client.invoices || []).map((inv: Invoice) => (
                    <tr key={inv.id} className="table-row">
                      <td className="td font-mono text-sm">{inv.invoice_number}</td>
                      <td className="td text-xs text-text-secondary">{format(new Date(inv.invoice_date), 'dd MMM yyyy')}</td>
                      <td className="td font-medium">₹{inv.total_amount?.toLocaleString()}</td>
                      <td className="td">
                        <span className={`badge ${
                          inv.status === 'paid' ? 'badge-success' :
                          inv.status === 'overdue' ? 'badge-danger' :
                          inv.status === 'sent' ? 'badge-warning' : 'badge-muted'
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}

          {activeTab === 'registrations' && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(client.client_registrations || []).length === 0
                ? <p className="text-text-muted text-sm col-span-2 py-8 text-center">No registrations added</p>
                : (client.client_registrations || []).map((r: any) => (
                  <div key={r.id} className="bg-surface-2 rounded-lg p-4 border border-border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="badge badge-brand uppercase">{r.type}</span>
                      {r.is_active && <span className="badge badge-success">Active</span>}
                    </div>
                    <p className="font-mono text-sm text-text-primary mt-2">{r.registration_number}</p>
                    {r.registered_name && <p className="text-xs text-text-muted mt-0.5">{r.registered_name}</p>}
                    {r.state && <p className="text-xs text-text-muted">{r.state}</p>}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
