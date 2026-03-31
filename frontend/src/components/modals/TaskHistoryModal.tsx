import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, History, MessageSquare } from 'lucide-react';
import { tasksApi } from '../../services/api';
import { STATUS_LABELS, STATUS_COLORS, type TaskHistory } from '../../types';
import { format } from 'date-fns';

interface Props {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

const TaskHistoryModal: React.FC<Props> = ({ taskId, taskTitle, onClose }) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['task-history', taskId],
    queryFn: () => tasksApi.getHistory(taskId),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-elevated w-full max-w-lg max-h-[80vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <History size={16} className="text-brand-glow"/>
            <h3 className="font-semibold text-text-primary text-sm">Task History</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="px-4 py-3 border-b border-border bg-surface-2/50 flex-shrink-0">
          <p className="text-xs text-text-muted truncate">{taskTitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({length:3}).map((_,i) => (
                <div key={i} className="h-16 bg-surface-2 rounded-lg animate-pulse"/>
              ))}
            </div>
          ) : (history as TaskHistory[]).length === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">No history recorded</p>
          ) : (
            <div className="space-y-3">
              {(history as TaskHistory[]).map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0">
                      <History size={13} className="text-text-muted"/>
                    </div>
                    {i < (history as any[]).length - 1 && <div className="w-px flex-1 bg-border mt-1"/>}
                  </div>
                  <div className="pb-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs ${STATUS_COLORS[h.to_status]}`}>{STATUS_LABELS[h.to_status]}</span>
                      {h.from_status && (
                        <span className="text-xs text-text-muted">from {STATUS_LABELS[h.from_status]}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {h.users?.name || 'System'} · {format(new Date(h.created_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                    {h.remarks && (
                      <div className="mt-2 p-2.5 rounded-lg bg-surface-3 border-l-2 border-danger/40">
                        <p className="text-xs text-text-secondary flex items-start gap-1.5">
                          <MessageSquare size={11} className="text-danger mt-0.5 flex-shrink-0"/>
                          {h.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TaskHistoryModal;
