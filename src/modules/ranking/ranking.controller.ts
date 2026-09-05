import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingQueryDto } from './dto/ranking-query.dto';
import { RankingService } from './ranking.service';

@Controller('ranking')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  ranking(@CurrentUser() user: RequestUser, @Query() q: RankingQueryDto) {
    return this.rankingService.ranking(user.userId, q.type ?? 'weekly');
  }
}
