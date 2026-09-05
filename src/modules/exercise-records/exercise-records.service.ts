import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  BusinessException,
  ErrorCodes,
} from '../../common/constants/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ExerciseRecordDto,
  serializeRecord,
} from '../../common/serializers/exercise-record.serializer';
import { genId } from '../../common/utils/id.util';
import { CreateRecordDto } from './dto/create-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';

/** 时长与起止差值偏差超此比例则采信客户端值但打审计标记（契约 §4.6 ⑭）。 */
const AUDIT_THRESHOLD = 0.3;

@Injectable()
export class ExerciseRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  // ⑭ POST /exercise-records
  async create(
    userId: string,
    dto: CreateRecordDto,
  ): Promise<ExerciseRecordDto> {
    // 幂等：同 petId + clientRecordId 已存在则直接回显，附加 duplicated 标记
    const existing = await this.prisma.exerciseRecord.findUnique({
      where: {
        petId_clientRecordId: {
          petId: dto.petId,
          clientRecordId: dto.clientRecordId,
        },
      },
      include: { route: { orderBy: { timestamp: 'asc' } } },
    });
    if (existing) {
      return serializeRecord(existing, { duplicated: true });
    }

    // 宠物归属校验（契约 §4.6 ⑭：失败 → 40301；不存在 → 40401）
    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId },
    });
    if (!pet || pet.deletedAt) {
      throw new BusinessException(ErrorCodes.PET_NOT_FOUND);
    }
    if (pet.userId !== userId) {
      throw new BusinessException(ErrorCodes.NOT_PET_OWNER);
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (!(endTime > startTime)) {
      throw new BusinessException(
        ErrorCodes.INVALID_PARAM,
        'endTime 必须 > startTime',
      );
    }

    const route = dto.route ?? [];
    const isManual = dto.isManual ?? false;
    // route=[] 仅当 type=catPlay 或 isManual=true 合法
    if (route.length === 0 && dto.type !== 'catPlay' && !isManual) {
      throw new BusinessException(
        ErrorCodes.INVALID_PARAM,
        'route 不能为空（除非 catPlay 或手动记录）',
      );
    }

    // 时长审计：与起止差值偏差 >30% 采信客户端值但打标记
    const spanSec = (endTime.getTime() - startTime.getTime()) / 1000;
    const isAudited =
      spanSec > 0 &&
      Math.abs(dto.duration - spanSec) / spanSec > AUDIT_THRESHOLD;

    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.exerciseRecord.create({
        data: {
          id: genId('r_'),
          clientRecordId: dto.clientRecordId,
          petId: dto.petId,
          userId,
          type: dto.type,
          catPlayType: dto.catPlayType ?? null,
          startTime,
          endTime,
          duration: dto.duration,
          distance: dto.distance,
          steps: dto.steps,
          locationName: dto.locationName ?? null,
          startPhotoUrl: dto.startPhotoUrl ?? null,
          isCompleted: dto.isCompleted ?? true,
          isManual,
          isAudited,
          route:
            route.length > 0
              ? {
                  create: route.map((p) => ({
                    latitude: p.latitude,
                    longitude: p.longitude,
                    timestamp: new Date(p.timestamp),
                    accuracy: p.accuracy ?? null,
                  })),
                }
              : undefined,
        },
        include: { route: { orderBy: { timestamp: 'asc' } } },
      });
      await tx.user.update({
        where: { id: userId },
        data: { totalExerciseCount: { increment: 1 } },
      });
      return created;
    });

    return serializeRecord(record);
  }

  // ⑮ GET /exercise-records
  async list(userId: string, q: QueryRecordsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const where: Prisma.ExerciseRecordWhereInput = { userId };
    if (q.petId) where.petId = q.petId;
    if (q.type) where.type = q.type;
    if (q.startDate || q.endDate) {
      where.startTime = {};
      if (q.startDate) {
        where.startTime.gte = new Date(`${q.startDate}T00:00:00+08:00`);
      }
      if (q.endDate) {
        where.startTime.lte = new Date(`${q.endDate}T23:59:59+08:00`);
      }
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.exerciseRecord.count({ where }),
      this.prisma.exerciseRecord.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { route: { orderBy: { timestamp: 'asc' } } },
      }),
    ]);
    return {
      list: rows.map((r) => serializeRecord(r, { thinned: true })),
      total,
      page,
      pageSize,
    };
  }

  // ⑯ GET /exercise-records/:id（含全量轨迹）
  async getOne(userId: string, id: string): Promise<ExerciseRecordDto> {
    const rec = await this.prisma.exerciseRecord.findUnique({
      where: { id },
      include: { route: { orderBy: { timestamp: 'asc' } } },
    });
    if (!rec) {
      throw new BusinessException(ErrorCodes.RECORD_NOT_FOUND);
    }
    if (rec.userId !== userId) {
      throw new BusinessException(ErrorCodes.NOT_PET_OWNER);
    }
    return serializeRecord(rec);
  }
}
