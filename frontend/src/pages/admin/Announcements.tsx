import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Megaphone, Loader2, X, Pin } from 'lucide-react';
import { announcementsApi } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Announcements: React.FC = () => {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: announcements = [] } = useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.getAll });

  const createMutation = useMutation({
    mutationFn: () => announcementsApi.create({ title, content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setTitle(''); setContent(''); toast.success('Announcement posted'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-5">
      <div><h1 className="page-title">Announcements</h1><p className="page-subtitle">Broadcast updates to all staff</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Megaphone size={16} className="text-brand-glow"/>Post Announcement</h3>
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..."/>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea rows={5} className="input resize-none" value={content} onChange={e => setContent(e.target.value)} placeholder="Write your message..."/>
          </div>
          <button onClick={() => createMutation.mutate()} disabled={!title.trim() || !content.trim() || createMutation.isPending} className="btn-primary w-full">
            {createMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>} Post
          </button>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {(announcements as any[]).map(ann => (
            <div key={ann.id} className={`card p-4 group ${ann.is_pinned ? 'border-brand/30 bg-brand/5' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_pinned && <Pin size={12} className="text-brand-glow"/>}
                    <h4 className="font-semibold text-text-primary text-sm">{ann.title}</h4>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{ann.content}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {ann.users?.name && `Posted by ${ann.users.name} · `}
                    {format(new Date(ann.created_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
                <button onClick={() => deleteMutation.mutate(ann.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-1">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
          {(announcements as any[]).length === 0 && (
            <div className="card p-12 text-center text-text-muted">
              <Megaphone size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No announcements yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
