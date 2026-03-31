import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { TimesheetsService } from '../shared-services';

@ApiTags('Timesheets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly svc: TimesheetsService) {}

  @Get()
  getEntries(@Req() req: any, @Query() params: any) {
    return this.svc.getEntries(req.user.firm_id, params.user_id, params.from, params.to);
  }

  @Get('weekly')
  getWeekly(@Req() req: any) {
    return this.svc.getWeeklyHours(req.user.id, req.user.firm_id);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.svc.create(req.user.firm_id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.svc.remove(id, req.user.firm_id);
  }
}
