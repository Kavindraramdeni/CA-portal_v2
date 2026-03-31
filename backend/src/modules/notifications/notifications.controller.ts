// notifications.controller.ts
import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  getUnread(@Req() req: any) {
    return this.svc.getUnread(req.user.id, req.user.firm_id);
  }

  @Patch('read')
  markRead(@Body('ids') ids: string[], @Req() req: any) {
    return this.svc.markRead(ids, req.user.id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.svc.markAllRead(req.user.id, req.user.firm_id);
  }
}
