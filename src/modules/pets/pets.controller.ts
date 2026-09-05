import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePetDto } from './dto/create-pet.dto';
import { QueryPetsDto } from './dto/query-pets.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetsService } from './pets.service';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly pets: PetsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() q: QueryPetsDto) {
    return this.pets.list(user.userId, q);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePetDto) {
    return this.pets.create(user.userId, dto);
  }

  @Get(':petId')
  getOne(@CurrentUser() user: RequestUser, @Param('petId') petId: string) {
    return this.pets.getOne(user.userId, petId);
  }

  @Patch(':petId')
  update(
    @CurrentUser() user: RequestUser,
    @Param('petId') petId: string,
    @Body() dto: UpdatePetDto,
  ) {
    return this.pets.update(user.userId, petId, dto);
  }

  @Delete(':petId')
  remove(@CurrentUser() user: RequestUser, @Param('petId') petId: string) {
    return this.pets.remove(user.userId, petId);
  }
}
