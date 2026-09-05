import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toCstIso } from '../../common/utils/time.util';

interface UserBadgeStats {
  recordCount: number;
  streakDays: number;
  totalDistanceKm: number;
}

interface BadgeRule {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (s: UserBadgeStats) => boolean;
}

/** 首批徽章清单（契约 §4.10：从前端硬编码版平移，建 badges 配置表）。 */
const BADGE_RULES: BadgeRule[] = [
  {
    id: 'first_walk',
    name: '初次出发',
    emoji: '🐾',
    description: '完成第一次遛狗',
    check: (s) => s.recordCount >= 1,
  },
  {
    id: 'streak_7',
    name: '坚持一周',
    emoji: '🔥',
    description: '连续打卡7天',
    check: (s) => s.streakDays >= 7,
  },
  {
    id: 'streak_30',
    name: '满月达人',
    emoji: '👑',
    description: '连续打卡30天',
    check: (s) => s.streakDays >= 30,
  },
  {
    id: 'total_50',
    name: '运动健将',
    emoji: '🏆',
    description: '累计完成50次运动',
    check: (s) => s.recordCount >= 50,
  },
  {
    id: 'explorer',
    name: '探索达人',
    emoji: '🧭',
    description: '累计运动100公里',
    check: (s) => s.totalDistanceKm >= 100,
  },
];

export interface BadgeDto {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

/**
 * 徽章（契约 §4.10 ㉓）：解锁时机由服务端落库。
 * 这里采用惰性评估——GET /badges 时按当前状态判定，新解锁即写 UserBadge。
 */
@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    await this.ensureBadges();
    const rows = await this.prisma.userBadge.findMany({
      where: { userId },
    });
    const unlockedAt = new Map(rows.map((r) => [r.badgeId, r.unlockedAt]));

    const stats = await this.computeStats(userId);
    const newlyUnlocked: string[] = [];

    const list: BadgeDto[] = BADGE_RULES.map((rule) => {
      const persisted = unlockedAt.get(rule.id);
      const isUnlocked = persisted != null || rule.check(stats);
      if (isUnlocked && persisted == null) newlyUnlocked.push(rule.id);
      return {
        id: rule.id,
        name: rule.name,
        emoji: rule.emoji,
        description: rule.description,
        isUnlocked,
        unlockedAt: persisted
          ? toCstIso(persisted)
          : isUnlocked
            ? toCstIso()
            : null,
      };
    });

    if (newlyUnlocked.length > 0) {
      await this.prisma.userBadge.createMany({
        data: newlyUnlocked.map((badgeId) => ({ userId, badgeId })),
        skipDuplicates: true,
      });
    }

    const unlockedCount = list.filter((b) => b.isUnlocked).length;
    return { list, unlockedCount };
  }

  /** 幂等写入 badges 配置表。 */
  private async ensureBadges(): Promise<void> {
    for (const rule of BADGE_RULES) {
      await this.prisma.badge.upsert({
        where: { id: rule.id },
        create: {
          id: rule.id,
          name: rule.name,
          emoji: rule.emoji,
          description: rule.description,
        },
        update: {
          name: rule.name,
          emoji: rule.emoji,
          description: rule.description,
        },
      });
    }
  }

  private async computeStats(userId: string): Promise<UserBadgeStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totalExerciseCount: true, streakDays: true },
    });
    const agg = await this.prisma.exerciseRecord.aggregate({
      where: { userId, isCompleted: true },
      _sum: { distance: true },
    });
    return {
      recordCount: user?.totalExerciseCount ?? 0,
      streakDays: user?.streakDays ?? 0,
      totalDistanceKm: agg._sum.distance ?? 0,
    };
  }
}
