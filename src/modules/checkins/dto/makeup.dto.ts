import { IsDateString } from 'class-validator';

/** 补签入参（契约 §4.7 ⑲：过去的日期，不能晚于今天）。 */
export class MakeupDto {
  @IsDateString()
  date!: string; // yyyy-MM-dd
}
