import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../shared-services';
@Module({ controllers: [UsersController], providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
