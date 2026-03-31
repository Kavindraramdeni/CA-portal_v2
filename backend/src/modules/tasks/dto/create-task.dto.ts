// dto/create-task.dto.ts
import { IsString, IsOptional, IsArray, IsBoolean, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty() @IsString() client_id: string;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() compliance_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() work_type?: string[];
  @ApiProperty() @IsDateString() due_date: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() target_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() period_from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() period_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['high','medium','low']) priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() assigned_to?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_team_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_internal?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_recurring?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() fee_amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimated_hours?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
