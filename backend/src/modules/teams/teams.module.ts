// teams.module.ts
import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from '../shared-services';
@Module({ controllers: [TeamsController], providers: [TeamsService], exports: [TeamsService] })
export class TeamsModule {}
