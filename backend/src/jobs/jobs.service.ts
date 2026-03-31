import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.module';

@Injectable()
export class JobsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @InjectQueue('recurring-tasks') private recurringQueue: Queue,
    @InjectQueue('deadline-alerts') private deadlineQueue: Queue,
    @InjectQueue('document-chase') private docChaseQueue: Queue,
  ) {}

  // Run every day at 8am IST to create recurring tasks
  @Cron('0 8 * * *', { timeZone: 'Asia/Kolkata' })
  async scheduleRecurringTasks() {
    const { data: schedules } = await this.supabase
      .from('recurring_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString());

    for (const schedule of schedules || []) {
      await this.recurringQueue.add('create-tasks', { schedule }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }
  }

  // Run every day at 9am IST for deadline alerts
  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async scheduleDeadlineAlerts() {
    await this.deadlineQueue.add('check-deadlines', {}, {
      attempts: 3,
    });
  }

  // Run every 3 days at 10am IST for document chasing
  @Cron('0 10 */3 * *', { timeZone: 'Asia/Kolkata' })
  async scheduleDocumentChase() {
    const { data: pending } = await this.supabase
      .from('document_requests')
      .select('id, reminder_count, last_reminder_at')
      .eq('is_complete', false)
      .lt('reminder_count', 5);

    for (const req of pending || []) {
      await this.docChaseQueue.add('send-reminder', { requestId: req.id }, {
        attempts: 2,
        delay: Math.random() * 60000, // Stagger sends
      });
    }
  }

  // Escalation check every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkEscalations() {
    const today = new Date().toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    const { data: atRisk } = await this.supabase
      .from('tasks')
      .select('id, firm_id, title, due_date, assigned_to, status')
      .lte('due_date', in3Days)
      .gte('due_date', today)
      .not('status', 'in', '("completed","approved","filed","acknowledgement_received")');

    for (const task of atRisk || []) {
      await this.supabase.from('tasks').update({ risk_score: 80 }).eq('id', task.id);
    }
  }

  // Weekly Monday digest at 8am IST
  @Cron('0 8 * * 1', { timeZone: 'Asia/Kolkata' })
  async weeklyDigest() {
    const { data: firms } = await this.supabase
      .from('firms')
      .select('id')
      .eq('subscription_active', true);

    for (const firm of firms || []) {
      await this.deadlineQueue.add('weekly-digest', { firmId: firm.id });
    }
  }
}
