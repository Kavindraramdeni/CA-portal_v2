import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { UserCog } from 'lucide-react';

const Users: React.FC = () => {
  const { data: users = [] } = useQuery({ queryKey: ['users-all'], queryFn: usersApi.getAll });
  const { data: capacity = [] } = useQuery({ queryKey: ['capacity'], queryFn: usersApi.getCapacity });

  const capMap = (capacity as any[]).reduce((m: any, u: any) => { m[u.id] = u; return m; }, {});
  const roleOrder = ['partner','manager','senior','junior','article'];

  return (
    <div className="space-y-5">
      <div><h1 className="page-title">Staff Management</h1><p className="page-subtitle">{(users as any[]).length} staff members</p></div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2/50">
              <tr><th className="th">Name</th><th className="th">Role</th><th className="th">Email</th><th className="th">Active Tasks</th><th className="th">Utilisation</th><th className="th">Status</th></tr>
            </thead>
            <tbody>
              {[...(users as any[])].sort((a,b) => roleOrder.indexOf(a.role)-roleOrder.indexOf(b.role)).map(u => {
                const cap = capMap[u.id];
                const pct = cap?.utilisation_pct || 0;
                return (
                  <tr key={u.id} className="table-row">
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand-glow text-sm font-bold">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{u.name}</p>
                          {u.designation && <p className="text-xs text-text-muted">{u.designation}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="td"><span className="badge badge-muted capitalize">{u.role}</span></td>
                    <td className="td text-xs text-text-secondary">{u.email}</td>
                    <td className="td text-sm">{cap?.current_tasks ?? '—'} / {cap?.capacity ?? u.max_tasks}</td>
                    <td className="td">
                      {cap ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden w-20">
                            <div className={`h-full rounded-full ${pct>80?'bg-danger':pct>60?'bg-warning':'bg-success'}`} style={{width:`${Math.min(pct,100)}%`}}/>
                          </div>
                          <span className="text-xs text-text-muted w-8">{pct}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="td">
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
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

export default Users;
