import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/** 月历查询入参（契约 §4.7 ⑰）。 */
export class CalendarDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2999)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
