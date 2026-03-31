import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { BillingService } from '../shared-services';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Get('invoices')
  getInvoices(@Req() req: any, @Query('client_id') clientId?: string) {
    return this.svc.getInvoices(req.user.firm_id, clientId);
  }

  @Get('outstanding')
  getOutstanding(@Req() req: any) {
    return this.svc.getOutstanding(req.user.firm_id);
  }

  @Post('invoices')
  @Roles('partner', 'manager')
  create(@Body() dto: any, @Req() req: any) {
    return this.svc.createInvoice(req.user.firm_id, req.user.id, dto);
  }

  @Patch('invoices/:id/status')
  @Roles('partner', 'manager')
  updateStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.updateStatus(id, req.user.firm_id, body.status, body.payment_reference);
  }
}
