import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.module';
import { OnEvent } from '@nestjs/event-emitter';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  // ─── In-app notifications ───────────────────────────────────

  async createInApp(data: {
    firm_id: string;
    user_id?: string;
    client_id?: string;
    task_id?: string;
    type: string;
    title: string;
    body: string;
    extra?: Record<string, any>;
  }) {
    const { error } = await this.supabase.from('notifications').insert({
      firm_id: data.firm_id,
      user_id: data.user_id,
      client_id: data.client_id,
      task_id: data.task_id,
      channel: 'in_app',
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.extra || {},
      sent_at: new Date().toISOString(),
    });
    if (error) console.error('Notification insert error:', error.message);
  }

  async getUnread(userId: string, firmId: string) {
    const { data } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('firm_id', firmId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(50);
    return data || [];
  }

  async markRead(ids: string[], userId: string) {
    await this.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', userId);
    return { success: true };
  }

  async markAllRead(userId: string, firmId: string) {
    await this.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('firm_id', firmId)
      .eq('is_read', false);
    return { success: true };
  }

  // ─── WhatsApp via WATI ──────────────────────────────────────

  async sendWhatsApp(phone: string, templateName: string, params: string[]) {
    const apiKey = this.config.get('WATI_API_KEY');
    const endpoint = this.config.get('WATI_ENDPOINT');
    if (!apiKey || !endpoint) {
      console.log(`[WhatsApp MOCK] To: ${phone}, Template: ${templateName}, Params:`, params);
      return;
    }
    try {
      await axios.post(
        `${endpoint}/api/v1/sendTemplateMessage`,
        {
          whatsappNumber: phone.replace('+', ''),
          template_name: templateName,
          broadcast_name: templateName,
          parameters: params.map((value, index) => ({ name: `p${index + 1}`, value })),
        },
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
    } catch (e) {
      console.error('WhatsApp send error:', e.message);
    }
  }

  // ─── Email via nodemailer ────────────────────────────────────

  async sendEmail(to: string, subject: string, html: string) {
    const smtpUser = this.config.get('SMTP_USER');
    if (!smtpUser) {
      console.log(`[Email MOCK] To: ${to}, Subject: ${subject}`);
      return;
    }
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(this.config.get('SMTP_PORT', '587')),
        secure: false,
        auth: { user: smtpUser, pass: this.config.get('SMTP_PASS') },
      });
      await transporter.sendMail({
        from: `CA Portal <${smtpUser}>`,
        to,
        subject,
        html,
      });
    } catch (e) {
      console.error('Email send error:', e.message);
    }
  }

  // ─── Event listeners ────────────────────────────────────────

  @OnEvent('task.created')
  async onTaskCreated({ task, firmId, userId }: any) {
    // Notify assigned staff
    for (const assigneeId of task.assigned_to || []) {
      await this.createInApp({
        firm_id: firmId,
        user_id: assigneeId,
        task_id: task.id,
        type: 'task_assigned',
        title: 'New task assigned',
        body: `You have been assigned: ${task.title}`,
        extra: { task_id: task.id },
      });
    }
  }

  @OnEvent('task.status_changed')
  async onStatusChanged({ task, toStatus, firmId }: any) {
    if (toStatus === 'pending_approval') {
      // Notify managers/partners
      const { data: managers } = await this.supabase
        .from('users')
        .select('id')
        .eq('firm_id', firmId)
        .in('role', ['partner', 'manager']);

      for (const mgr of managers || []) {
        await this.createInApp({
          firm_id: firmId,
          user_id: mgr.id,
          task_id: task.id,
          type: 'approval_needed',
          title: 'Task pending approval',
          body: `${task.title} is ready for your review`,
        });
      }
    }
    if (toStatus === 'approved') {
      for (const assigneeId of task.assigned_to || []) {
        await this.createInApp({
          firm_id: firmId,
          user_id: assigneeId,
          task_id: task.id,
          type: 'task_approved',
          title: 'Task approved',
          body: `${task.title} has been approved`,
        });
      }
    }
  }

  // ─── Document request reminders ─────────────────────────────

  async sendDocumentRequestReminder(requestId: string) {
    const { data: req } = await this.supabase
      .from('document_requests')
      .select('*, clients(name, phone, email), tasks(title)')
      .eq('id', requestId)
      .single();

    if (!req || req.is_complete) return;

    const client = req.clients;
    const pending = (req.checklist_items as any[]).filter(i => i.status !== 'uploaded');

    if (pending.length === 0) return;

    // Send WhatsApp
    if (client.phone) {
      await this.sendWhatsApp(client.phone, 'document_reminder', [
        client.name,
        req.tasks.title,
        pending.length.toString(),
        `${this.config.get('FRONTEND_URL')}/client/upload/${req.token}`,
      ]);
    }

    // Update reminder count
    await this.supabase
      .from('document_requests')
      .update({
        reminder_count: req.reminder_count + 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  }
}
