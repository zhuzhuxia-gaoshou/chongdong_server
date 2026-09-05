import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { BadgesModule } from './modules/badges/badges.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { ExerciseRecordsModule } from './modules/exercise-records/exercise-records.module';
import { PetsModule } from './modules/pets/pets.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { StatsModule } from './modules/stats/stats.module';
import { SystemModule } from './modules/system/system.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    SystemModule,
    UploadModule,
    UsersModule,
    PetsModule,
    ExerciseRecordsModule,
    CheckinsModule,
    StatsModule,
    RankingModule,
    BadgesModule,
  ],
})
export class AppModule {}
