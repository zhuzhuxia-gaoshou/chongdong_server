import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

@Module({
  imports: [AuthModule], // JwtAuthGuard / JwtStrategy 依赖
  controllers: [PetsController],
  providers: [PetsService],
})
export class PetsModule {}
