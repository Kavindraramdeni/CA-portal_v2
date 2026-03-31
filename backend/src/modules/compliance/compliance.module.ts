import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from '../shared-services';
@Module({ controllers: [ComplianceController], providers: [ComplianceService], exports: [ComplianceService] })
export class ComplianceModule {}
