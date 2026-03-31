import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ComplianceService } from '../shared-services';

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly svc: ComplianceService) {}

  @Get('calendar')
  getCalendar(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.getStatutoryCalendar(from, to);
  }

  @Get('schedules')
  getSchedules(@Req() req: any) { return this.svc.getRecurringSchedules(req.user.firm_id); }

  @Post('schedules')
  @Roles('partner', 'manager')
  createSchedule(@Body() dto: any, @Req() req: any) {
    return this.svc.createRecurringSchedule(req.user.firm_id, dto);
  }
}
