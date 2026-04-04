// tasks.controller.ts
import {
  Controller, Get, Post, Put, Patch, Delete, Body,
  Param, Query, UseGuards, Req
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Req() req: any, @Query() filter: TaskFilterDto) {
    return this.tasksService.findAll(req.user.firm_id, filter);
  }

  @Get('dashboard-stats')
  getStats(@Req() req: any) {
    return this.tasksService.getDashboardStats(req.user.firm_id, req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.findOne(id, req.user.firm_id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.getHistory(id, req.user.firm_id);
  }

  @Post()
  @Roles('partner', 'manager', 'senior')
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(req.user.firm_id, req.user.id, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req: any) {
    return this.tasksService.update(id, req.user.firm_id, req.user.id, dto);
  }

  @Patch(':id/approve')
  @Roles('partner', 'manager')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.approve(id, req.user.firm_id, req.user.id);
  }

  @Patch(':id/reject')
  @Roles('partner', 'manager')
  reject(@Param('id') id: string, @Body('remarks') remarks: string, @Req() req: any) {
    return this.tasksService.reject(id, req.user.firm_id, req.user.id, remarks);
  }

  @Post('bulk-approve')
  @Roles('partner', 'manager')
  bulkApprove(@Body('ids') ids: string[], @Req() req: any) {
    return this.tasksService.bulkApprove(ids, req.user.firm_id, req.user.id);
  }

  @Delete(':id')
  @Roles('partner', 'manager')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.remove(id, req.user.firm_id);
  }
}
