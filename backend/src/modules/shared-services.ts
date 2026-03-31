import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.module';

@Injectable()
export class BillingService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async getInvoices(firmId: string, clientId?: string) {
    let q = this.supabase
      .from('invoices')
      .select('*, clients(name, email, billing_contact_email)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });
    if (clientId) q = q.eq('client_id', clientId);
    const { data } = await q;
    return data;
  }

  async createInvoice(firmId: string, userId: string, dto: any) {
    const subtotal = dto.line_items.reduce((s: number, i: any) => s + i.amount, 0);
    const tax = subtotal * 0.18;
    const { data } = await this.supabase.from('invoices').insert({
      ...dto,
      firm_id: firmId,
      created_by: userId,
      invoice_number: await this.generateInvoiceNumber(firmId),
      subtotal,
      tax_amount: tax,
      total_amount: subtotal + tax,
      due_date: dto.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }).select().single();
    return data;
  }

  async updateStatus(id: string, firmId: string, status: string, paymentRef?: string) {
    const { data } = await this.supabase.from('invoices').update({
      status,
      payment_reference: paymentRef,
      payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', id).eq('firm_id', firmId).select().single();
    return data;
  }

  async getOutstanding(firmId: string) {
    const { data } = await this.supabase
      .from('invoices')
      .select('total_amount, paid_amount, due_date, clients(name)')
      .eq('firm_id', firmId)
      .in('status', ['sent', 'overdue']);
    return data;
  }

  private async generateInvoiceNumber(firmId: string): Promise<string> {
    const { count } = await this.supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('firm_id', firmId);
    const num = ((count || 0) + 1).toString().padStart(4, '0');
    return `INV-${new Date().getFullYear()}-${num}`;
  }
}

@Injectable()
export class TimesheetsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async getEntries(firmId: string, userId?: string, from?: string, to?: string) {
    let q = this.supabase
      .from('time_entries')
      .select('*, tasks(title, clients(name)), users(name)')
      .eq('firm_id', firmId)
      .order('date', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    if (from) q = q.gte('date', from);
    if (to) q = q.lte('date', to);
    const { data } = await q;
    return data;
  }

  async create(firmId: string, userId: string, dto: any) {
    const { data } = await this.supabase.from('time_entries').insert({
      ...dto, firm_id: firmId, user_id: userId,
    }).select().single();
    return data;
  }

  async remove(id: string, firmId: string) {
    await this.supabase.from('time_entries').delete().eq('id', id).eq('firm_id', firmId);
    return { success: true };
  }

  async getWeeklyHours(userId: string, firmId: string) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const { data } = await this.supabase.from('time_entries')
      .select('hours, date')
      .eq('user_id', userId)
      .eq('firm_id', firmId)
      .gte('date', startOfWeek.toISOString().split('T')[0]);
    return { total: data?.reduce((s, e) => s + e.hours, 0) || 0, entries: data };
  }
}

@Injectable()
export class TeamsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async findAll(firmId: string) {
    const { data } = await this.supabase
      .from('teams')
      .select('*, team_members(user_id, users(id, name, role, avatar_url))')
      .eq('firm_id', firmId);
    return data;
  }

  async create(firmId: string, dto: any) {
    const { data } = await this.supabase.from('teams').insert({ ...dto, firm_id: firmId }).select().single();
    return data;
  }

  async addMember(teamId: string, userId: string) {
    const { data } = await this.supabase.from('team_members').insert({ team_id: teamId, user_id: userId }).select();
    return data;
  }

  async removeMember(teamId: string, userId: string) {
    await this.supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    return { success: true };
  }

  async remove(id: string, firmId: string) {
    await this.supabase.from('teams').delete().eq('id', id).eq('firm_id', firmId);
    return { success: true };
  }
}

@Injectable()
export class AnnouncementsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async findAll(firmId: string) {
    const { data } = await this.supabase
      .from('announcements')
      .select('*, users(name)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });
    return data;
  }

  async create(firmId: string, userId: string, dto: any) {
    const { data } = await this.supabase.from('announcements').insert({
      ...dto, firm_id: firmId, created_by: userId,
    }).select().single();
    return data;
  }

  async remove(id: string, firmId: string) {
    await this.supabase.from('announcements').delete().eq('id', id).eq('firm_id', firmId);
    return { success: true };
  }
}

@Injectable()
export class ComplianceService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async getStatutoryCalendar(from?: string, to?: string) {
    let q = this.supabase.from('statutory_deadlines').select('*').order('due_date');
    if (from) q = q.gte('due_date', from);
    if (to) q = q.lte('due_date', to);
    const { data } = await q;
    return data;
  }

  async getRecurringSchedules(firmId: string) {
    const { data } = await this.supabase.from('recurring_schedules')
      .select('*').eq('firm_id', firmId).eq('is_active', true);
    return data;
  }

  async createRecurringSchedule(firmId: string, dto: any) {
    const { data } = await this.supabase.from('recurring_schedules')
      .insert({ ...dto, firm_id: firmId }).select().single();
    return data;
  }
}

@Injectable()
export class UsersService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async findAll(firmId: string) {
    const { data } = await this.supabase
      .from('users')
      .select('id, name, email, role, designation, is_active, avatar_url, max_tasks, skills')
      .eq('firm_id', firmId)
      .order('name');
    return data;
  }

  async update(id: string, firmId: string, dto: any) {
    const { data } = await this.supabase
      .from('users').update(dto).eq('id', id).eq('firm_id', firmId).select().single();
    return data;
  }

  async getCapacity(firmId: string) {
    const { data: users } = await this.supabase
      .from('users').select('id, name, role, max_tasks').eq('firm_id', firmId).neq('role', 'client');
    const { data: tasks } = await this.supabase
      .from('tasks').select('assigned_to').eq('firm_id', firmId)
      .not('status', 'in', '("completed","approved")');

    return (users || []).map(u => ({
      ...u,
      current_tasks: (tasks || []).filter(t => t.assigned_to?.includes(u.id)).length,
      capacity: u.max_tasks || 20,
      utilisation_pct: Math.round(
        ((tasks || []).filter(t => t.assigned_to?.includes(u.id)).length / (u.max_tasks || 20)) * 100
      ),
    }));
  }
}
