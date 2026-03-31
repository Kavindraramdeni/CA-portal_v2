import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AnnouncementsService } from '../shared-services';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly svc: AnnouncementsService) {}

  @Get()
  findAll(@Req() req: any) { return this.svc.findAll(req.user.firm_id); }

  @Post()
  @Roles('partner', 'manager')
  create(@Body() dto: any, @Req() req: any) {
    return this.svc.create(req.user.firm_id, req.user.id, dto);
  }

  @Delete(':id')
  @Roles('partner', 'manager')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.svc.remove(id, req.user.firm_id);
  }
}
