import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsQueryDto } from './dto/stats-query.dto';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('weekly')
  weekly(@CurrentUser() user: RequestUser, @Query() q: StatsQueryDto) {
    return this.stats.weekly(user.userId, q.date);
  }

  @Get('monthly')
  monthly(@CurrentUser() user: RequestUser, @Query() q: StatsQueryDto) {
    return this.stats.monthly(user.userId, q.date);
  }
}
