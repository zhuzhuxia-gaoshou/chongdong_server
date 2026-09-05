import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExerciseRecordsController } from './exercise-records.controller';
import { ExerciseRecordsService } from './exercise-records.service';

@Module({
  imports: [AuthModule],
  controllers: [ExerciseRecordsController],
  providers: [ExerciseRecordsService],
})
export class ExerciseRecordsModule {}
