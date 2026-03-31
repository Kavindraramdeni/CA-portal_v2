import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, UserPlus, Trash2, X, Loader2 } from 'lucide-react';
import { teamsApi, usersApi } from '../../services/api';
import toast from 'react-hot-toast';

const Teams: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [addMemberTeam, setAddMemberTeam] = useState<any>(null);
  const [teamName, setTeamName] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });

  const createMutation = useMutation({
    mutationFn: (name: string) => teamsApi.create({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); setShowCreate(false); setTeamName(''); toast.success('Team created'); },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => teamsApi.addMember(teamId, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); setAddMemberTeam(null); setSelectedUser(''); toast.success('Member added'); },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => teamsApi.removeMember(teamId, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); toast.success('Member removed'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); toast.success('Team deleted'); },
  });

  const getUser = (id: string) => (users as any[]).find(u => u.id === id);

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="page-title">Teams</h1><p className="page-subtitle">Manage staff teams</p></div>
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16}/>New Team</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(teams as any[]).map(team => {
            const teamUsers = (team.team_members || []).map((m: any) => m.users || getUser(m.user_id)).filter(Boolean);
            return (
              <div key={team.id} className="card p-5 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
                        <Users size={15} className="text-brand-glow"/>
                      </div>
                      <h3 className="font-semibold text-text-primary">{team.name}</h3>
                    </div>
                    <p className="text-xs text-text-muted mt-1 ml-10">{teamUsers.length} member{teamUsers.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => { if(confirm('Delete this team?')) deleteMutation.mutate(team.id); }}
                    className="text-text-muted hover:text-danger transition-colors p-1">
                    <Trash2 size={15}/>
                  </button>
                </div>

                <div className="flex-1 space-y-1.5 min-h-[60px]">
                  {teamUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand-glow text-xs font-bold">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{u.name}</p>
                          <p className="text-xs text-text-muted capitalize">{u.role}</p>
                        </div>
                      </div>
                      <button onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: u.id })}
                        className="text-text-muted hover:text-danger transition-colors p-0.5">
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                  {teamUsers.length === 0 && <p className="text-xs text-text-muted text-center py-4">No members yet</p>}
                </div>

                <button onClick={() => setAddMemberTeam(team)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-xs text-text-muted hover:border-brand/40 hover:text-brand-glow transition-colors">
                  <UserPlus size={13}/> Add Member
                </button>
              </div>
            );
          })}

          {(teams as any[]).length === 0 && (
            <div className="card p-10 text-center text-text-muted col-span-3">
              <Users size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No teams yet. Create your first team.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-elevated w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">Create Team</h3>
              <button onClick={() => setShowCreate(false)}><X size={16} className="text-text-muted"/></button>
            </div>
            <div className="p-5">
              <label className="label">Team Name</label>
              <input className="input" value={teamName} onChange={e => setTeamName(e.target.value)}
                placeholder="e.g., Senior Auditors" onKeyDown={e => e.key==='Enter' && createMutation.mutate(teamName)}/>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMutation.mutate(teamName)} disabled={!teamName.trim() || createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>} Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addMemberTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-elevated w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">Add to {addMemberTeam.name}</h3>
              <button onClick={() => setAddMemberTeam(null)}><X size={16} className="text-text-muted"/></button>
            </div>
            <div className="p-5">
              <label className="label">Select Employee</label>
              <select className="input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">Choose employee...</option>
                {(users as any[])
                  .filter(u => !(addMemberTeam.team_members || []).some((m: any) => (m.user_id || m.users?.id) === u.id))
                  .map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button onClick={() => setAddMemberTeam(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => selectedUser && addMemberMutation.mutate({ teamId: addMemberTeam.id, userId: selectedUser })}
                disabled={!selectedUser || addMemberMutation.isPending} className="btn-primary">
                {addMemberMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14}/>} Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Teams;
