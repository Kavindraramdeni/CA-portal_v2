// ─── analytics.service.ts ────────────────────────────────────
import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.module';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async getOverview(firmId: string) {
    const [tasks, clients, invoices, timeEntries] = await Promise.all([
      this.supabase.from('tasks').select('status, priority, due_date, compliance_type, created_at').eq('firm_id', firmId),
      this.supabase.from('clients').select('health_score, is_active, created_at').eq('firm_id', firmId),
      this.supabase.from('invoices').select('status, total_amount, paid_amount').eq('firm_id', firmId),
      this.supabase.from('time_entries').select('hours, date, user_id, is_billable').eq('firm_id', firmId),
    ]);

    const t = tasks.data || [];
    const c = clients.data || [];
    const inv = invoices.data || [];
    const te = timeEntries.data || [];

    const totalRevenue = inv.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0);
    const outstanding = inv.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);
    const billableHours = te.filter(e => e.is_billable).reduce((s, e) => s + e.hours, 0);

    return {
      tasks: {
        total: t.length,
        by_status: this.groupBy(t, 'status'),
        by_priority: this.groupBy(t, 'priority'),
        by_compliance: this.groupBy(t, 'compliance_type'),
        completion_rate: t.length ? Math.round(t.filter(t2 => ['completed','approved'].includes(t2.status)).length / t.length * 100) : 0,
      },
      clients: {
        total: c.filter(cl => cl.is_active).length,
        avg_health: c.length ? Math.round(c.reduce((s, cl) => s + (cl.health_score || 100), 0) / c.length) : 100,
      },
      billing: {
        total_revenue: totalRevenue,
        outstanding,
        collection_rate: (totalRevenue + outstanding) > 0 ? Math.round(totalRevenue / (totalRevenue + outstanding) * 100) : 0,
      },
      time: {
        total_hours: te.reduce((s, e) => s + e.hours, 0),
        billable_hours: billableHours,
        billability_rate: te.length ? Math.round(billableHours / te.reduce((s, e) => s + e.hours, 0) * 100) : 0,
      },
    };
  }

  async getStaffUtilisation(firmId: string) {
    const { data: users } = await this.supabase
      .from('users')
      .select('id, name, role, max_tasks')
      .eq('firm_id', firmId)
      .not('role', 'eq', 'client');

    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('assigned_to, status, due_date')
      .eq('firm_id', firmId)
      .not('status', 'in', '("completed","approved")');

    return (users || []).map(user => {
      const userTasks = (tasks || []).filter(t => t.assigned_to?.includes(user.id));
      return {
        ...user,
        active_tasks: userTasks.length,
        utilisation: Math.round((userTasks.length / (user.max_tasks || 20)) * 100),
        overdue: userTasks.filter(t => t.due_date < new Date().toISOString().split('T')[0]).length,
      };
    });
  }

  private groupBy(arr: any[], key: string): Record<string, number> {
    return arr.reduce((acc, item) => {
      const k = item[key] || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }
}
