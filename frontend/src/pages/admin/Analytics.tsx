import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { analyticsApi } from '../../services/api';
import { TrendingUp, Users, Clock, CreditCard } from 'lucide-react';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1','#8b5cf6','#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview'], queryFn: analyticsApi.getOverview,
  });
  const { data: staffUtil = [] } = useQuery({
    queryKey: ['staff-util'], queryFn: analyticsApi.getStaffUtil,
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({length:8}).map((_,i)=>(
        <div key={i} className="card p-5 animate-pulse h-24 bg-surface-2" />
      ))}
    </div>
  );

  const statusData = Object.entries(overview?.tasks?.by_status || {}).map(([name, value]) => ({
    name: name.replace(/_/g,' '), value,
  }));

  const complianceData = Object.entries(overview?.tasks?.by_compliance || {})
    .sort((a,b) => (b[1] as number) - (a[1] as number)).slice(0,8)
    .map(([name, count]) => ({ name: name.replace(/_/g,' ').toUpperCase(), count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Firm performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Tasks', value: overview?.tasks?.total || 0, icon: TrendingUp, color:'bg-brand' },
          { label:'Completion Rate', value: `${overview?.tasks?.completion_rate || 0}%`, icon: TrendingUp, color:'bg-success' },
          { label:'Collection Rate', value: `${overview?.billing?.collection_rate || 0}%`, icon: CreditCard, color:'bg-warning' },
          { label:'Billability', value: `${overview?.time?.billability_rate || 0}%`, icon: Clock, color:'bg-info' },
        ].map(({label,value,icon:Icon,color}) => (
          <div key={label} className="stat-card">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
              <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
              <Icon size={20} className="text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Revenue Collected', value: `₹${((overview?.billing?.total_revenue||0)/1000).toFixed(0)}k` },
          { label:'Outstanding', value: `₹${((overview?.billing?.outstanding||0)/1000).toFixed(0)}k` },
          { label:'Total Hours', value: overview?.time?.total_hours?.toFixed(0) || 0 },
          { label:'Billable Hours', value: overview?.time?.billable_hours?.toFixed(0) || 0 },
        ].map(({label,value}) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={100} label={({name, percent}) => `${(percent*100).toFixed(0)}%`}
                labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span className="text-xs text-text-secondary capitalize">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by compliance */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Tasks by Compliance Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={complianceData} layout="vertical" margin={{left:20,right:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" horizontal={false} />
              <XAxis type="number" tick={{fill:'#475569', fontSize:11}} />
              <YAxis type="category" dataKey="name" width={90} tick={{fill:'#94a3b8', fontSize:10}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff utilisation */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Staff Utilisation</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-surface-2/50">
                <th className="th">Staff Member</th>
                <th className="th">Role</th>
                <th className="th">Active Tasks</th>
                <th className="th">Capacity</th>
                <th className="th">Utilisation</th>
                <th className="th">Overdue</th>
              </tr></thead>
              <tbody>
                {(staffUtil as any[]).map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="td font-medium">{u.name}</td>
                    <td className="td"><span className="text-xs text-text-muted capitalize">{u.role}</span></td>
                    <td className="td">{u.active_tasks}</td>
                    <td className="td">{u.capacity}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${u.utilisation_pct > 80 ? 'bg-danger' : u.utilisation_pct > 60 ? 'bg-warning' : 'bg-success'}`}
                            style={{width:`${Math.min(u.utilisation_pct,100)}%`}} />
                        </div>
                        <span className="text-xs text-text-muted w-9 text-right">{u.utilisation_pct}%</span>
                      </div>
                    </td>
                    <td className="td">
                      {u.overdue > 0 ? <span className="badge badge-danger">{u.overdue}</span> : <span className="text-text-muted text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
