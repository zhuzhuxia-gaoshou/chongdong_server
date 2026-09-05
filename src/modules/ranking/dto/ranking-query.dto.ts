import { IsIn, IsOptional, IsString } from 'class-validator';

/** 排行榜查询入参（契约 §4.9 ㉒）。 */
export class RankingQueryDto {
  @IsString()
  @IsOptional()
  @IsIn(['weekly', 'monthly'])
  type?: 'weekly' | 'monthly';

  @IsString()
  @IsOptional()
  @IsIn(['all'])
  scope?: string; // v0.1 仅 all
}
