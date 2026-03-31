import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Check, AlertTriangle, Clock } from 'lucide-react';
import { billingApi } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge: Record<string, string> = {
  paid: 'badge-success', sent: 'badge-brand', overdue: 'badge-danger', draft: 'badge-muted', cancelled: 'badge-muted',
};

const BillingPage: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'invoices' | 'outstanding'>('invoices');

  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => billingApi.getInvoices() });
  const { data: outstanding = [] } = useQuery({ queryKey: ['outstanding'], queryFn: billingApi.getOutstanding });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => billingApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices', 'outstanding'] }); toast.success('Invoice updated'); },
  });

  const totalOutstanding = (outstanding as any[]).reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Billing & Invoices</h1><p className="page-subtitle">Manage client billing</p></div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div><p className="text-xs text-text-muted uppercase tracking-wider">Total Invoices</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{(invoices as any[]).length}</p></div>
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center"><CreditCard size={20} className="text-white"/></div>
        </div>
        <div className="stat-card">
          <div><p className="text-xs text-text-muted uppercase tracking-wider">Outstanding</p>
          <p className="text-3xl font-bold text-danger mt-1">₹{(totalOutstanding/1000).toFixed(0)}k</p></div>
          <div className="w-11 h-11 rounded-xl bg-danger flex items-center justify-center"><AlertTriangle size={20} className="text-white"/></div>
        </div>
        <div className="stat-card">
          <div><p className="text-xs text-text-muted uppercase tracking-wider">Paid This Month</p>
          <p className="text-3xl font-bold text-success mt-1">
            ₹{((invoices as any[]).filter(i => i.status==='paid').reduce((s,i) => s+i.total_amount, 0)/1000).toFixed(0)}k
          </p></div>
          <div className="w-11 h-11 rounded-xl bg-success flex items-center justify-center"><Check size={20} className="text-white"/></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6">
        {(['invoices','outstanding'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab===t ? 'border-brand text-brand-glow' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2/50">
                <tr>
                  <th className="th">Invoice #</th>
                  <th className="th">Client</th>
                  <th className="th">Date</th>
                  <th className="th">Due Date</th>
                  <th className="th">Amount</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(invoices as any[]).map(inv => (
                  <tr key={inv.id} className="table-row">
                    <td className="td font-mono text-xs text-brand-glow">{inv.invoice_number}</td>
                    <td className="td font-medium">{inv.clients?.name}</td>
                    <td className="td text-xs text-text-secondary">{format(new Date(inv.invoice_date), 'dd MMM yy')}</td>
                    <td className="td text-xs text-text-secondary">{inv.due_date ? format(new Date(inv.due_date), 'dd MMM yy') : '—'}</td>
                    <td className="td font-semibold">₹{inv.total_amount?.toLocaleString('en-IN')}</td>
                    <td className="td"><span className={`badge ${statusBadge[inv.status] || 'badge-muted'}`}>{inv.status}</span></td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        {inv.status === 'sent' && (
                          <button onClick={() => updateStatusMutation.mutate({ id: inv.id, status: 'paid' })}
                            className="btn-sm bg-success/10 text-success hover:bg-success/20 border border-success/20">
                            <Check size={12}/> Mark Paid
                          </button>
                        )}
                        {inv.status === 'draft' && (
                          <button onClick={() => updateStatusMutation.mutate({ id: inv.id, status: 'sent' })}
                            className="btn-sm btn-primary">
                            Send
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(invoices as any[]).length === 0 && (
                  <tr><td colSpan={7} className="text-center text-text-muted py-12 text-sm">No invoices yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'outstanding' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2/50">
                <tr><th className="th">Client</th><th className="th">Due Date</th><th className="th">Outstanding</th><th className="th">Status</th></tr>
              </thead>
              <tbody>
                {(outstanding as any[]).map((inv: any, i) => (
                  <tr key={i} className="table-row">
                    <td className="td font-medium">{inv.clients?.name}</td>
                    <td className="td text-xs text-text-secondary">{inv.due_date ? format(new Date(inv.due_date), 'dd MMM yy') : '—'}</td>
                    <td className="td font-semibold text-danger">₹{(inv.total_amount - inv.paid_amount).toLocaleString('en-IN')}</td>
                    <td className="td"><span className={`badge ${statusBadge[inv.status] || 'badge-muted'}`}>{inv.status}</span></td>
                  </tr>
                ))}
                {(outstanding as any[]).length === 0 && (
                  <tr><td colSpan={4} className="text-center text-text-muted py-12 text-sm">
                    <Check size={28} className="text-success mx-auto mb-2 opacity-50"/>No outstanding payments!
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
