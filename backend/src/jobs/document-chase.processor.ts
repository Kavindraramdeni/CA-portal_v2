import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Processor('document-chase')
export class DocumentChaseProcessor {
  constructor(private readonly notifications: NotificationsService) {}

  @Process('send-reminder')
  async sendReminder(job: Job<{ requestId: string }>) {
    await this.notifications.sendDocumentRequestReminder(job.data.requestId);
  }
}
