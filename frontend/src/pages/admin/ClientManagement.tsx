// ClientManagement.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2, Heart, Phone, Mail, ExternalLink } from 'lucide-react';
import { clientsApi } from '../../services/api';
import type { Client } from '../../types';
import toast from 'react-hot-toast';

const ClientManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search], queryFn: () => clientsApi.getAll(search),
  });

  const healthColor = (score: number) =>
    score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Clients</h1><p className="page-subtitle">{(clients as Client[]).length} active clients</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} />Add Client</button>
      </div>
      <div className="card p-4">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="input pl-9" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? Array.from({length:6}).map((_,i)=>(
          <div key={i} className="card p-5 animate-pulse h-36 bg-surface-2" />
        )) : (clients as Client[]).map(c => (
          <Link key={c.id} to={`/admin/clients/${c.id}`} className="card p-5 hover:border-border-2 hover:shadow-glow-sm transition-all block">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <Building2 size={18} className="text-brand-glow" />
              </div>
              <div className="flex items-center gap-1.5">
                <Heart size={13} className={healthColor(c.health_score)} />
                <span className={`text-xs font-semibold ${healthColor(c.health_score)}`}>{c.health_score}</span>
              </div>
            </div>
            <h3 className="font-semibold text-text-primary">{c.name}</h3>
            {c.client_code && <p className="text-xs text-text-muted mt-0.5">{c.client_code}</p>}
            <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
              {c.phone && <span className="flex items-center gap-1"><Phone size={11}/>{c.phone}</span>}
              {c.email && <span className="flex items-center gap-1 truncate"><Mail size={11}/>{c.email}</span>}
            </div>
            {c.pan && <p className="text-xs text-text-muted mt-1.5 font-mono">PAN: {c.pan}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
};
export default ClientManagement;
