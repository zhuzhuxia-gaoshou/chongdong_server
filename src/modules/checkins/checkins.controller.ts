import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarDto } from './dto/calendar.dto';
import { MakeupDto } from './dto/makeup.dto';
import { CheckinsService } from './checkins.service';

@Controller('checkins')
@UseGuards(JwtAuthGuard)
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Get('calendar')
  calendar(@CurrentUser() user: RequestUser, @Query() q: CalendarDto) {
    return this.checkins.calendar(user.userId, q.year, q.month);
  }

  @Get('today')
  today(@CurrentUser() user: RequestUser) {
    return this.checkins.today(user.userId);
  }

  @Post('makeup')
  @HttpCode(200)
  makeup(@CurrentUser() user: RequestUser, @Body() dto: MakeupDto) {
    return this.checkins.makeup(user.userId, dto.date);
  }
}
