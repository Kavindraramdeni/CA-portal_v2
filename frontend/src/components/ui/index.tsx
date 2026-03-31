import React from 'react';
import { clsx } from 'clsx';
import { Loader2, X, AlertCircle, InboxIcon } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '../../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../../types';

// ─── Spinner ──────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 20, className,
}) => (
  <Loader2 size={size} className={clsx('animate-spin text-text-muted', className)} />
);

// ─── PageLoader ───────────────────────────────────────────────
export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size={32} className="text-brand" />
  </div>
);

// ─── StatCard ─────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  trend?: { value: number; label: string };
}
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, sub, trend }) => (
  <div className="stat-card group hover:border-border-2 transition-colors">
    <div>
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      {trend && (
        <p className={clsx('text-xs mt-1 font-medium', trend.value >= 0 ? 'text-success' : 'text-danger')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
    <div className={clsx('p-3 rounded-xl', color)}>
      {icon}
    </div>
  </div>
);

// ─── StatusBadge ──────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => (
  <span className={STATUS_COLORS[status]}>
    {STATUS_LABELS[status]}
  </span>
);

// ─── PriorityDot ──────────────────────────────────────────────
export const PriorityDot: React.FC<{ priority: TaskPriority }> = ({ priority }) => (
  <span className={clsx('flex items-center gap-1.5 text-xs font-medium capitalize', PRIORITY_COLORS[priority])}>
    <span className={clsx('w-1.5 h-1.5 rounded-full bg-current')} />
    {priority}
  </span>
);

// ─── Avatar ───────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-yellow-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500',
];
const initials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
const colorForName = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export const Avatar: React.FC<{ name: string; url?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  name, url, size = 'md',
}) => {
  const sizeClass = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  if (url) return <img src={url} alt={name} className={clsx('rounded-full object-cover ring-2 ring-border', sizeClass)} />;
  return (
    <div className={clsx('rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-border', sizeClass, colorForName(name))}>
      {initials(name)}
    </div>
  );
};

// ─── AvatarGroup ──────────────────────────────────────────────
export const AvatarGroup: React.FC<{ names: string[]; max?: number }> = ({ names, max = 3 }) => {
  const shown = names.slice(0, max);
  const extra = names.length - max;
  return (
    <div className="flex -space-x-2">
      {shown.map((n, i) => (
        <div key={i} title={n}>
          <Avatar name={n} size="sm" />
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-surface-3 border-2 border-border flex items-center justify-center text-xs text-text-muted font-medium">
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────
export const EmptyState: React.FC<{ message?: string; icon?: React.ReactNode }> = ({
  message = 'No data found', icon,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-text-muted mb-3">{icon || <InboxIcon size={36} />}</div>
    <p className="text-text-secondary text-sm">{message}</p>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  if (!isOpen) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full card-elevated animate-slide-up', widths[size])}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 p-4 border-t border-border bg-surface-0 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── HealthBadge ──────────────────────────────────────────────
export const HealthBadge: React.FC<{ score: number }> = ({ score }) => {
  const cls = score >= 80 ? 'badge-success' : score >= 50 ? 'badge-warning' : 'badge-danger';
  const label = score >= 80 ? 'Healthy' : score >= 50 ? 'At Risk' : 'Critical';
  return <span className={cls}>{label} {score}</span>;
};

// ─── SectionHeader ────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title, subtitle, action,
}) => (
  <div className="flex items-start justify-between mb-5">
    <div>
      <h2 className="page-title">{title}</h2>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── DueDateChip ──────────────────────────────────────────────
export const DueDateChip: React.FC<{ date: string }> = ({ date }) => {
  const d = new Date(date);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  const isOverdue = days < 0;
  const isToday = days === 0;
  const isClose = days <= 3 && days >= 0;
  return (
    <span className={clsx('text-xs font-medium', isOverdue ? 'text-danger' : isToday ? 'text-warning' : isClose ? 'text-warning' : 'text-text-secondary')}>
      {isOverdue ? `${Math.abs(days)}d overdue` : isToday ? 'Today' : `${days}d left`}
    </span>
  );
};

// ─── ErrorAlert ───────────────────────────────────────────────
export const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
    <AlertCircle size={15} />
    {message}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('animate-pulse bg-surface-3 rounded', className)} />
);

export const SkeletonCard: React.FC = () => (
  <div className="stat-card">
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
    <Skeleton className="h-12 w-12 rounded-xl" />
  </div>
);

export const SkeletonRow: React.FC = () => (
  <tr className="table-row">
    {[1,2,3,4,5].map(i => (
      <td key={i} className="td"><Skeleton className="h-4 w-full" /></td>
    ))}
  </tr>
);
