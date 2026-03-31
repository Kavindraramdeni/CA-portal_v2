import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from '../shared-services';
@Module({ controllers: [AnnouncementsController], providers: [AnnouncementsService], exports: [AnnouncementsService] })
export class AnnouncementsModule {}
