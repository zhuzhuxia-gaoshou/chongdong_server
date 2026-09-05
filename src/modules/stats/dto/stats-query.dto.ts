import { IsDateString, IsOptional } from 'class-validator';

/** 统计查询入参（契约 §4.8 ⑳㉑：date 所在周/月）。 */
export class StatsQueryDto {
  @IsDateString()
  @IsOptional()
  date?: string; // yyyy-MM-dd，缺省=今天
}
