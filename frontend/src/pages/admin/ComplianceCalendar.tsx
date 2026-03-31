import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { complianceApi } from '../../services/api';
import { Calendar, AlertTriangle } from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { COMPLIANCE_LABELS, type StatutoryDeadline, type ComplianceType } from '../../types';

const ComplianceCalendar: React.FC = () => {
  const { data: deadlines = [] } = useQuery({
    queryKey: ['compliance-calendar'], queryFn: () => complianceApi.getCalendar(),
  });

  const today = new Date();
  const in30 = addDays(today, 30);

  const upcoming = (deadlines as StatutoryDeadline[]).filter(d => !isPast(new Date(d.due_date)));
  const due_soon = upcoming.filter(d => isWithinInterval(new Date(d.due_date), { start: today, end: in30 }));

  const urgency = (d: StatutoryDeadline) => {
    const days = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
    if (days <= 7) return 'badge-danger';
    if (days <= 14) return 'badge-warning';
    return 'badge-brand';
  };

  return (
    <div className="space-y-5">
      <div><h1 className="page-title">Compliance Calendar</h1><p className="page-subtitle">Statutory deadlines for FY 2025-26</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div><p className="text-xs text-text-muted uppercase tracking-wider">Due in 30 Days</p>
          <p className="text-3xl font-bold text-warning mt-1">{due_soon.length}</p></div>
          <div className="w-11 h-11 rounded-xl bg-warning flex items-center justify-center"><AlertTriangle size={20} className="text-white"/></div>
        </div>
        <div className="stat-card">
          <div><p className="text-xs text-text-muted uppercase tracking-wider">Upcoming Total</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{upcoming.length}</p></div>
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center"><Calendar size={20} className="text-white"/></div>
        </div>
        <div className="stat-card">
          <div><p className="text-xs text-text-muted uppercase tracking-wider">Past Deadlines</p>
          <p className="text-3xl font-bold text-text-muted mt-1">{(deadlines as any[]).length - upcoming.length}</p></div>
          <div className="w-11 h-11 rounded-xl bg-surface-3 flex items-center justify-center"><Calendar size={20} className="text-text-muted"/></div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2/50">
              <tr><th className="th">Compliance</th><th className="th">Type</th><th className="th">Due Date</th><th className="th">Days Left</th><th className="th">Penalty / Day</th></tr>
            </thead>
            <tbody>
              {(deadlines as StatutoryDeadline[]).sort((a,b) => new Date(a.due_date).getTime()-new Date(b.due_date).getTime()).map(d => {
                const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
                const past = daysLeft < 0;
                return (
                  <tr key={d.id} className={`table-row ${past ? 'opacity-50' : ''}`}>
                    <td className="td font-medium">{d.name}</td>
                    <td className="td"><span className="badge badge-muted text-xs">{COMPLIANCE_LABELS[d.compliance_type as ComplianceType] || d.compliance_type}</span></td>
                    <td className="td text-sm">{format(new Date(d.due_date), 'dd MMM yyyy')}</td>
                    <td className="td">
                      {past ? <span className="text-xs text-text-muted">Past</span> :
                        <span className={`badge ${urgency(d)}`}>{daysLeft}d</span>}
                    </td>
                    <td className="td text-xs text-text-secondary">
                      {d.penalty_per_day ? `₹${d.penalty_per_day}/day` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceCalendar;
