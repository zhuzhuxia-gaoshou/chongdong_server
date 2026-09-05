import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadgesService } from './badges.service';

@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.badges.list(user.userId);
  }
}
