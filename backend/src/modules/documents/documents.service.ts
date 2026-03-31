import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.module';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  async uploadFile(
    firmId: string,
    taskId: string,
    file: Express.Multer.File,
    uploadedBy: string,
    checklistItemId?: string,
  ) {
    const ext = file.originalname.split('.').pop();
    const path = `${firmId}/${taskId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data: storageData, error: storageError } = await this.supabase
      .storage
      .from('documents')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError) throw new Error(storageError.message);

    const { data } = await this.supabase
      .from('document_uploads')
      .insert({
        task_id: taskId,
        firm_id: firmId,
        uploaded_by: uploadedBy,
        file_name: file.originalname,
        file_path: storageData.path,
        file_size: file.size,
        file_type: file.mimetype,
        checklist_item_id: checklistItemId,
        status: 'uploaded',
      })
      .select()
      .single();

    return data;
  }

  async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await this.supabase
      .storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour
    if (error) throw new Error(error.message);
    return data.signedUrl;
  }

  async getUploadsForTask(taskId: string, firmId: string) {
    const { data } = await this.supabase
      .from('document_uploads')
      .select('*')
      .eq('task_id', taskId)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });
    return data;
  }

  async createDocumentRequest(taskId: string, firmId: string, clientId: string, checklistItems: any[]) {
    const { data, error } = await this.supabase
      .from('document_requests')
      .insert({
        task_id: taskId,
        firm_id: firmId,
        client_id: clientId,
        checklist_items: checklistItems.map((item, i) => ({
          id: `item-${i}`,
          name: item,
          status: 'pending',
          uploaded_at: null,
        })),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getDocumentRequest(token: string) {
    const { data, error } = await this.supabase
      .from('document_requests')
      .select('*, tasks(title, clients(name, firm_id)), firms(name, logo_url)')
      .eq('token', token)
      .single();

    if (error || !data) throw new Error('Invalid or expired document request link');
    if (new Date(data.token_expires_at) < new Date()) throw new Error('This upload link has expired');
    return data;
  }

  async updateChecklistItem(requestId: string, itemId: string, fileUploadId: string) {
    const { data: req } = await this.supabase
      .from('document_requests')
      .select('checklist_items')
      .eq('id', requestId)
      .single();

    if (!req) throw new Error('Request not found');

    const items = (req.checklist_items as any[]).map(item =>
      item.id === itemId
        ? { ...item, status: 'uploaded', uploaded_at: new Date().toISOString(), file_upload_id: fileUploadId }
        : item
    );

    const isComplete = items.every(i => i.status === 'uploaded');

    await this.supabase
      .from('document_requests')
      .update({ checklist_items: items, is_complete: isComplete, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    return { is_complete: isComplete };
  }
}
