import { Processor, Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.module';

@Processor('recurring-tasks')
export class RecurringTasksProcessor {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Process('create-tasks')
  async createRecurringTasks(job: Job<{ schedule: any }>) {
    const { schedule } = job.data;

    // Get applicable clients
    const clientIds = schedule.applicable_client_ids?.length
      ? schedule.applicable_client_ids
      : await this.getAllActiveClients(schedule.firm_id);

    const dueDate = this.calculateDueDate(schedule.compliance_type);
    const targetDate = new Date(new Date(dueDate).getTime() - 3 * 86400000)
      .toISOString().split('T')[0];

    for (const clientId of clientIds) {
      // Check if task already exists for this period
      const { data: existing } = await this.supabase
        .from('tasks')
        .select('id')
        .eq('client_id', clientId)
        .eq('compliance_type', schedule.compliance_type)
        .eq('recurring_schedule_id', schedule.id)
        .gte('due_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .single();

      if (existing) continue;

      const { data: client } = await this.supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .single();

      await this.supabase.from('tasks').insert({
        firm_id: schedule.firm_id,
        client_id: clientId,
        title: `${schedule.name} — ${client?.name}`,
        compliance_type: schedule.compliance_type,
        priority: schedule.default_priority,
        due_date: dueDate,
        target_date: targetDate,
        assigned_to: schedule.default_assigned_to || [],
        status: 'yet_to_start',
        is_recurring: true,
        recurring_schedule_id: schedule.id,
      });
    }

    // Update next run date
    const nextRun = this.getNextRunDate(schedule.frequency);
    await this.supabase
      .from('recurring_schedules')
      .update({ last_run_at: new Date().toISOString(), next_run_at: nextRun })
      .eq('id', schedule.id);
  }

  private async getAllActiveClients(firmId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('clients')
      .select('id')
      .eq('firm_id', firmId)
      .eq('is_active', true);
    return data?.map(c => c.id) || [];
  }

  private calculateDueDate(complianceType: string): string {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const dueDates: Record<string, () => string> = {
      gst_r1: () => new Date(year, month + 1, 11).toISOString().split('T')[0],
      gst_r3b: () => new Date(year, month + 1, 20).toISOString().split('T')[0],
      tds_q1: () => `${year}-07-31`,
      tds_q2: () => `${year}-10-31`,
      tds_q3: () => `${year + 1}-01-31`,
      tds_q4: () => `${year + 1}-05-31`,
      advance_tax_q3: () => `${year}-12-15`,
      itr_individual: () => `${year}-07-31`,
    };

    return dueDates[complianceType]?.() ||
      new Date(year, month + 1, 30).toISOString().split('T')[0];
  }

  private getNextRunDate(frequency: string): string {
    const now = new Date();
    if (frequency === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    }
    if (frequency === 'quarterly') {
      return new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();
    }
    return new Date(now.getFullYear() + 1, 0, 1).toISOString();
  }
}
