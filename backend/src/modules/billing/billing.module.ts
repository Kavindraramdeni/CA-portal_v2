import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from '../shared-services';

@Module({
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
