import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { TeamsService } from '../shared-services';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly svc: TeamsService) {}

  @Get()
  findAll(@Req() req: any) { return this.svc.findAll(req.user.firm_id); }

  @Post()
  @Roles('partner', 'manager')
  create(@Body() dto: any, @Req() req: any) { return this.svc.create(req.user.firm_id, dto); }

  @Post(':id/members')
  @Roles('partner', 'manager')
  addMember(@Param('id') id: string, @Body('user_id') userId: string) {
    return this.svc.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  @Roles('partner', 'manager')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.svc.removeMember(id, userId);
  }

  @Delete(':id')
  @Roles('partner', 'manager')
  remove(@Param('id') id: string, @Req() req: any) { return this.svc.remove(id, req.user.firm_id); }
}
