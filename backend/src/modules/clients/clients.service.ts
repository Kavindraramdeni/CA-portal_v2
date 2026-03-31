import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.module';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAll(firmId: string, search?: string) {
    let query = this.supabase
      .from('clients')
      .select('*, client_registrations(type, registration_number)')
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('name');

    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id: string, firmId: string) {
    const { data, error } = await this.supabase
      .from('clients')
      .select(`
        *,
        client_registrations(*),
        tasks(id, title, status, due_date, priority, compliance_type),
        invoices(id, invoice_number, total_amount, status, due_date)
      `)
      .eq('id', id)
      .eq('firm_id', firmId)
      .single();

    if (error || !data) throw new NotFoundException('Client not found');
    return data;
  }

  async create(firmId: string, userId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('clients')
      .insert({ ...dto, firm_id: firmId, created_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, firmId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('clients')
      .update(dto)
      .eq('id', id)
      .eq('firm_id', firmId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string, firmId: string) {
    const { error } = await this.supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id)
      .eq('firm_id', firmId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async addRegistration(clientId: string, firmId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('client_registrations')
      .insert({ ...dto, client_id: clientId, firm_id: firmId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async recalculateHealthScore(clientId: string, firmId: string) {
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('status, due_date, created_at')
      .eq('client_id', clientId)
      .eq('firm_id', firmId);

    const { data: invoices } = await this.supabase
      .from('invoices')
      .select('status, due_date')
      .eq('client_id', clientId)
      .eq('firm_id', firmId);

    const { data: docRequests } = await this.supabase
      .from('document_requests')
      .select('is_complete, reminder_count, created_at, updated_at')
      .eq('client_id', clientId)
      .eq('firm_id', firmId);

    let score = 100;

    // Deduct for overdue tasks caused by client
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = tasks?.filter(t =>
      t.due_date < today && !['completed', 'approved'].includes(t.status)
    ).length || 0;
    score -= overdueCount * 5;

    // Deduct for slow document submission
    const avgReminders = docRequests?.length
      ? docRequests.reduce((sum, r) => sum + r.reminder_count, 0) / docRequests.length
      : 0;
    score -= Math.min(avgReminders * 3, 20);

    // Deduct for overdue invoices
    const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0;
    score -= overdueInvoices * 8;

    score = Math.max(0, Math.min(100, Math.round(score)));

    await this.supabase
      .from('clients')
      .update({ health_score: score })
      .eq('id', clientId);

    return { health_score: score };
  }

  async getClientStats(firmId: string) {
    const { data } = await this.supabase
      .from('clients')
      .select('health_score, is_active')
      .eq('firm_id', firmId)
      .eq('is_active', true);

    if (!data) return {};
    const avg = data.reduce((s, c) => s + (c.health_score || 100), 0) / data.length;
    return {
      total: data.length,
      avg_health_score: Math.round(avg),
      healthy: data.filter(c => c.health_score >= 80).length,
      at_risk: data.filter(c => c.health_score >= 50 && c.health_score < 80).length,
      critical: data.filter(c => c.health_score < 50).length,
    };
  }
}
