import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { Task, User } from '../../types';
import { StatusBadge, PriorityDot, DueDateChip, EmptyState, SkeletonRow, AvatarGroup } from './index';

interface TaskTableProps {
  tasks: Task[];
  users?: User[];
  loading?: boolean;
  renderActions?: (task: Task) => React.ReactNode;
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  showClient?: boolean;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks, users = [], loading, renderActions,
  selectable, selectedIds = [], onSelect, onSelectAll,
  showClient = true,
}) => {
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || '?';
  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {selectable && (
              <th className="th w-10">
                <input
                  type="checkbox"
                  className="rounded border-border bg-surface-2"
                  checked={allSelected}
                  onChange={onSelectAll}
                />
              </th>
            )}
            {showClient && <th className="th">Client / Task</th>}
            <th className="th">Status</th>
            <th className="th">Priority</th>
            <th className="th">Due Date</th>
            <th className="th">Assigned</th>
            {renderActions && <th className="th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : tasks.length === 0
            ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="No tasks match the current filters" />
                </td>
              </tr>
            )
            : tasks.map(task => (
              <tr
                key={task.id}
                className={`table-row ${selectedIds.includes(task.id) ? 'bg-brand/5' : ''}`}
              >
                {selectable && (
                  <td className="td">
                    <input
                      type="checkbox"
                      className="rounded border-border bg-surface-2"
                      checked={selectedIds.includes(task.id)}
                      onChange={() => onSelect?.(task.id)}
                    />
                  </td>
                )}
                {showClient && (
                  <td className="td max-w-[200px]">
                    <p className="font-semibold text-text-primary truncate">
                      {task.clients?.name || '—'}
                    </p>
                    <p className="text-text-muted text-xs truncate mt-0.5">{task.title}</p>
                  </td>
                )}
                <td className="td">
                  <StatusBadge status={task.status} />
                </td>
                <td className="td">
                  <PriorityDot priority={task.priority} />
                </td>
                <td className="td">
                  <div>
                    <p className="text-text-secondary">
                      {format(new Date(task.due_date), 'dd MMM yyyy')}
                    </p>
                    <DueDateChip date={task.due_date} />
                  </div>
                </td>
                <td className="td">
                  {task.assigned_to?.length > 0 ? (
                    <AvatarGroup
                      names={task.assigned_to.map(id => getUserName(id))}
                      max={3}
                    />
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                {renderActions && (
                  <td className="td text-right">
                    {renderActions(task)}
                  </td>
                )}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
};
