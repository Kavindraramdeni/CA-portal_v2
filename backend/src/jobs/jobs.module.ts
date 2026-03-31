import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RecurringTasksProcessor } from './recurring-tasks.processor';
import { DeadlineAlertsProcessor } from './deadline-alerts.processor';
import { DocumentChaseProcessor } from './document-chase.processor';
import { JobsService } from './jobs.service';
import { TasksModule } from '../modules/tasks/tasks.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'recurring-tasks' },
      { name: 'deadline-alerts' },
      { name: 'document-chase' },
      { name: 'billing' },
    ),
    TasksModule,
    NotificationsModule,
  ],
  providers: [
    RecurringTasksProcessor,
    DeadlineAlertsProcessor,
    DocumentChaseProcessor,
    JobsService,
  ],
  exports: [JobsService],
})
export class JobsModule {}
