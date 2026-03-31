// analytics.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('overview')
  @Roles('partner', 'manager')
  getOverview(@Req() req: any) {
    return this.svc.getOverview(req.user.firm_id);
  }

  @Get('staff-utilisation')
  @Roles('partner', 'manager')
  getStaffUtil(@Req() req: any) {
    return this.svc.getStaffUtilisation(req.user.firm_id);
  }
}
