// clients.controller.ts
import {
  Controller, Get, Post, Put, Delete, Body,
  Param, Query, UseGuards, Req
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Req() req: any, @Query('search') search?: string) {
    return this.clientsService.findAll(req.user.firm_id, search);
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.clientsService.getClientStats(req.user.firm_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, req.user.firm_id);
  }

  @Post()
  @Roles('partner', 'manager')
  create(@Body() dto: any, @Req() req: any) {
    return this.clientsService.create(req.user.firm_id, req.user.id, dto);
  }

  @Put(':id')
  @Roles('partner', 'manager', 'senior')
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.clientsService.update(id, req.user.firm_id, dto);
  }

  @Delete(':id')
  @Roles('partner')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.remove(id, req.user.firm_id);
  }

  @Post(':id/registrations')
  @Roles('partner', 'manager')
  addRegistration(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.clientsService.addRegistration(id, req.user.firm_id, dto);
  }

  @Post(':id/health-score')
  recalcHealth(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.recalculateHealthScore(id, req.user.firm_id);
  }
}
