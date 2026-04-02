import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SUPABASE_CLIENT } from '../../config/supabase.module';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';

@Injectable()
export class TasksService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(firmId: string, filter: TaskFilterDto) {
    // ✅ FIX: Validate firm_id exists
    if (!firmId || firmId === 'undefined') {
      throw new BadRequestException('Firm ID is required. User profile may not be loaded correctly.');
    }

    let query = this.supabase
      .from('tasks')
      .select(`
        *,
        clients(id, name, client_code),
        users!tasks_created_by_fkey(id, name),
        teams(id, name)
      `)
      .eq('firm_id', firmId)
      .order('due_date', { ascending: true });

    if (filter.status) query = query.eq('status', filter.status);
    if (filter.priority) query = query.eq('priority', filter.priority);
    if (filter.client_id) query = query.eq('client_id', filter.client_id);
    if (filter.assigned_to) query = query.contains('assigned_to', [filter.assigned_to]);
    if (filter.compliance_type) query = query.eq('compliance_type', filter.compliance_type);
    if (filter.due_from) query = query.gte('due_date', filter.due_from);
    if (filter.due_to) query = query.lte('due_date', filter.due_to);
    if (filter.search) query = query.ilike('title', `%${filter.search}%`);

    const { data, error } = await query;
    
    if (error) {
      console.error('Tasks query error:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
    
    return data || [];
  }

  async findOne(id: string, firmId: string) {
    // ✅ FIX: Validate firm_id
    if (!firmId || firmId === 'undefined') {
      throw new BadRequestException('Firm ID is required');
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        clients(*),
        teams(*),
        task_history(*, users(name)),
        document_requests(*, document_uploads(*)),
        submissions(*, users(name)),
        task_queries(*)
      `)
      .eq('id', id)
      .eq('firm_id', firmId)
      .single();

    if (error || !data) {
      console.error('Task fetch error:', error);
      throw new NotFoundException('Task not found');
    }
    
    return data;
  }

  async create(firmId: string, userId: string, dto: CreateTaskDto) {
    // ✅ FIX: Validate firm_id
    if (!firmId || firmId === 'undefined') {
      throw new BadRequestException('Firm ID is required');
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        ...dto,
        firm_id: firmId,
        created_by: userId,
        status: 'yet_to_start',
      })
      .select()
      .single();

    if (error) {
      console.error('Task creation error:', error);
      throw new Error(error.message);
    }

    // Log history
    await this.addHistory(data.id, firmId, null, 'yet_to_start', userId);

    // Emit event for notifications / document request
    this.eventEmitter.emit('task.created', { task: data, firmId, userId });

    return data;
  }

  async update(id: string, firmId: string, userId: string, dto: UpdateTaskDto) {
    // ✅ FIX: Validate firm_id
    if (!firmId || firmId === 'undefined') {
      throw new BadRequestException('Firm ID is required');
    }

    const existing = await this.findOne(id, firmId);

    const { data, error } = await this.supabase
      .from('tasks')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('firm_id', firmId)
      .select()
      .single();

    if (error) {
      console.error('Task update error:', error);
      throw new Error(error.message);
    }

    // Log status change history
    if (dto.status && dto.status !== existing.status) {
      await this.addHistory(id, firmId, existing.status, dto.status, userId, dto.remarks);
      this.eventEmitter.emit('task.status_changed', {
        task: data,
        fromStatus: existing.status,
        toStatus: dto.status,
        userId,
        firmId,
      });
    }

    return data;
  }

  async remove(id: string, firmId: string) {
    // ✅ FIX: Validate firm_id
    if (!firmId || firmId === 'undefined') {
      throw new BadRequestException('Firm ID is required');
    }

    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('firm_id', firmId);
    
    if (error) {
      console.error('Task deletion error:', error);
      throw new Error(error.message);
    }
    
    return { success: true };
  }

  async approve(id: string, firmId: string, userId: string) {
    return this.update(id, firmId, userId, { status: 'approved' } as UpdateTaskDto);
  }

  async reject(id: string, firmId: string, userId: string, remarks: string) {
    return this.update(id, firmId, userId, { status: 'in_progress', remarks } as UpdateTaskDto);
  }

  async bulkApprove(ids: string[], firmId: string, userId: string) {
    // ✅ FIX: Validate firm_id
    if (!firmId || firmId === 'undefined') {
      throw new BadRequestException('Firm ID is required');
    }

    const results = await Promise.all(ids.map(id => this.approve(id, firmId, userId)));
    return { approved: results.length };
  }

  async getHistory(taskId: string, firmId: string) {
    // ✅ FIX: Validate firm_id
    if (!firmId || firmId === 'undefined') {
      throw new BadRequestException('Firm ID is required');
    }

    const { data, error } = await this.supabase
      .from('task_history')
      .select('*, users(name)')
      .eq('task_id', taskId)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Task history error:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async getDashboardStats(firmId: string, userId: string, role: string) {
    // ✅ FIX: Validate firm_id
    if (!firmId || firmId === 'undefined') {
      console.warn('⚠️ Dashboard stats called with undefined firm_id');
      return {
        total: 0,
        completed: 0,
        pending: 0,
        pending_approval: 0,
        overdue: 0,
        due_today: 0,
        due_this_week: 0,
        high_risk: 0,
      };
    }

    const { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('status, priority, due_date, assigned_to, risk_score')
      .eq('firm_id', firmId);

    if (error) {
      console.error('Dashboard stats error:', error);
      return {
        total: 0,
        completed: 0,
        pending: 0,
        pending_approval: 0,
        overdue: 0,
        due_today: 0,
        due_this_week: 0,
        high_risk: 0,
      };
    }

    if (!tasks) return {};

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in3Days = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0];
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];

    if (role === 'partner' || role === 'manager') {
      return {
        total: tasks.length,
        completed: tasks.filter(t => ['completed', 'approved'].includes(t.status)).length,
        pending: tasks.filter(t => ['yet_to_start', 'in_progress', 'in_preparation'].includes(t.status)).length,
        pending_approval: tasks.filter(t => t.status === 'pending_approval').length,
        overdue: tasks.filter(t => t.due_date < today && !['completed', 'approved'].includes(t.status)).length,
        due_today: tasks.filter(t => t.due_date === today).length,
        due_this_week: tasks.filter(t => t.due_date >= today && t.due_date <= in7Days).length,
        high_risk: tasks.filter(t => t.risk_score >= 70).length,
      };
    }

    const myTasks = tasks.filter(t => t.assigned_to?.includes(userId));
    return {
      assigned: myTasks.length,
      pending: myTasks.filter(t => ['yet_to_start', 'in_progress'].includes(t.status)).length,
      completed: myTasks.filter(t => ['completed', 'approved'].includes(t.status)).length,
      due_this_week: myTasks.filter(t => t.due_date >= today && t.due_date <= in7Days).length,
      overdue: myTasks.filter(t => t.due_date < today && !['completed', 'approved'].includes(t.status)).length,
    };
  }

  private async addHistory(
    taskId: string,
    firmId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    remarks?: string,
  ) {
    const { error } = await this.supabase.from('task_history').insert({
      task_id: taskId,
      firm_id: firmId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      remarks,
    });

    if (error) {
      console.error('Task history insert error:', error);
      // Don't throw - history is not critical
    }
  }
}
