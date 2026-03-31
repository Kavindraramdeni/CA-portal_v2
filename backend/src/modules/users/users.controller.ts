import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { UsersService } from '../shared-services';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get()
  findAll(@Req() req: any) { return this.svc.findAll(req.user.firm_id); }

  @Get('capacity')
  getCapacity(@Req() req: any) { return this.svc.getCapacity(req.user.firm_id); }

  @Put(':id')
  @Roles('partner', 'manager')
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.svc.update(id, req.user.firm_id, dto);
  }
}
