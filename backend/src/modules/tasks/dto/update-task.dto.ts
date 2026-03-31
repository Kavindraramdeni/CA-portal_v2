import { IsString, IsOptional, IsArray, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() target_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() assigned_to?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_team_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() filing_reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() acknowledgement_number?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() acknowledgement_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() udin?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() billable_hours?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() fee_amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
}
