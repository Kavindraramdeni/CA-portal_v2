// deadline-alerts.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.module';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Processor('deadline-alerts')
export class DeadlineAlertsProcessor {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly notifications: NotificationsService,
  ) {}

  @Process('check-deadlines')
  async checkDeadlines(job: Job) {
    const today = new Date().toISOString().split('T')[0];
    const in3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('*, clients(name, phone, email), firms(id)')
      .lte('due_date', in7)
      .gte('due_date', today)
      .not('status', 'in', '("completed","approved","filed")');

    for (const task of tasks || []) {
      const daysLeft = Math.ceil(
        (new Date(task.due_date).getTime() - Date.now()) / 86400000,
      );

      // Notify assigned staff
      for (const userId of task.assigned_to || []) {
        await this.notifications.createInApp({
          firm_id: task.firm_id,
          user_id: userId,
          task_id: task.id,
          type: daysLeft <= 1 ? 'deadline_critical' : daysLeft <= 3 ? 'deadline_warning' : 'deadline_info',
          title: daysLeft <= 1 ? '🚨 Due today!' : `Due in ${daysLeft} days`,
          body: `${task.title} for ${task.clients?.name}`,
        });
      }

      // WhatsApp to client if document-related task
      if (daysLeft <= 3 && task.clients?.phone) {
        await this.notifications.sendWhatsApp(
          task.clients.phone,
          'deadline_reminder',
          [task.clients.name, task.title, daysLeft.toString(), task.due_date],
        );
      }
    }
  }

  @Process('weekly-digest')
  async weeklyDigest(job: Job<{ firmId: string }>) {
    const { firmId } = job.data;
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('title, due_date, status, clients(name)')
      .eq('firm_id', firmId)
      .lte('due_date', in7)
      .gte('due_date', today)
      .order('due_date');

    const { data: partners } = await this.supabase
      .from('users')
      .select('id, email')
      .eq('firm_id', firmId)
      .in('role', ['partner', 'manager']);

    for (const partner of partners || []) {
      await this.notifications.createInApp({
        firm_id: firmId,
        user_id: partner.id,
        type: 'weekly_digest',
        title: `Weekly digest: ${tasks?.length || 0} tasks due this week`,
        body: tasks?.slice(0, 3).map(t => `${t.title} (${t.due_date})`).join(', ') || 'No tasks due',
      });
    }
  }
}
