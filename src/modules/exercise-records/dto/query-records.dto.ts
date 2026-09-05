import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/** 运动记录查询入参（契约 §4.6 ⑮）。 */
export class QueryRecordsDto {
  @IsString()
  @IsOptional()
  petId?: string;

  @IsEnum(['walkDog', 'catPlay'])
  @IsOptional()
  type?: 'walkDog' | 'catPlay';

  @IsDateString()
  @IsOptional()
  startDate?: string; // yyyy-MM-dd，闭区间，按东八区

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;
}
