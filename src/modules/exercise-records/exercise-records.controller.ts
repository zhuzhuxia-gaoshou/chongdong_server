import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRecordDto } from './dto/create-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';
import { ExerciseRecordsService } from './exercise-records.service';

@Controller('exercise-records')
@UseGuards(JwtAuthGuard)
export class ExerciseRecordsController {
  constructor(private readonly records: ExerciseRecordsService) {}

  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateRecordDto) {
    return this.records.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() q: QueryRecordsDto) {
    return this.records.list(user.userId, q);
  }

  @Get(':id')
  getOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.records.getOne(user.userId, id);
  }
}
