import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TaskFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() client_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() compliance_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() due_from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() due_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
