import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { toCstDate, toCstIso } from '../../common/utils/time.util';

/** 缓存刷新周期（契约 §4.9：≤5 分钟）。 */
const CACHE_TTL = 300;
const TOP_N = 50;

export interface RankingItem {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  value: number; // 周期内运动总分钟数
  isMe: boolean;
}

/**
 * 排行榜（契约 §4.9 ㉒）：Redis ZSet 缓存，口径=周期内运动总分钟数。
 * weekly=滚动近7天；monthly=自然月。前 50 + 我的名次。
 */
@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async ranking(userId: string, type: 'weekly' | 'monthly' = 'weekly') {
    const key = `rank:${type}:minutes`;
    const buildKey = `rank:build:${type}`;
    const r = this.redis.getClient();

    if (!(await r.get(buildKey))) {
      await this.rebuild(type, key, buildKey);
    }

    const raw = await r.zrevrange(key, 0, TOP_N - 1, 'WITHSCORES');
    const members: { userId: string; value: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      members.push({ userId: raw[i], value: Math.round(Number(raw[i + 1])) });
    }

    const users =
      members.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: members.map((m) => m.userId) } },
            select: { id: true, nickname: true, avatarUrl: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const list: RankingItem[] = members.map((m, idx) => ({
      rank: idx + 1,
      userId: m.userId,
      nickname: userMap.get(m.userId)?.nickname ?? '铲屎官',
      avatarUrl: userMap.get(m.userId)?.avatarUrl ?? null,
      value: m.value,
      isMe: m.userId === userId,
    }));

    const me = await this.buildMe(userId, key);
    const updatedAt = (await r.get(buildKey)) ?? toCstIso();
    return { type, metric: 'minutes', updatedAt, list, me };
  }

  private async buildMe(userId: string, key: string): Promise<RankingItem> {
    const r = this.redis.getClient();
    const score = await r.zscore(key, userId);
    const rank = await r.zrevrank(key, userId);
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true, avatarUrl: true },
    });
    return {
      rank: rank != null ? rank + 1 : 0,
      userId,
      nickname: u?.nickname ?? '铲屎官',
      avatarUrl: u?.avatarUrl ?? null,
      value: score != null ? Math.round(Number(score)) : 0,
      isMe: true,
    };
  }

  private async rebuild(
    type: 'weekly' | 'monthly',
    key: string,
    buildKey: string,
  ): Promise<void> {
    const r = this.redis.getClient();
    const today = toCstDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    let start: string;
    if (type === 'weekly') {
      const d = new Date(`${today}T12:00:00+08:00`);
      d.setDate(d.getDate() - 6); // 滚动近 7 天
      start = toCstDate(d);
    } else {
      const [y, m] = today.split('-').map(Number);
      start = `${y}-${pad(m)}-01`;
    }

    const rows = await this.prisma.exerciseRecord.findMany({
      where: {
        isCompleted: true,
        startTime: {
          gte: new Date(`${start}T00:00:00+08:00`),
          lte: new Date(`${today}T23:59:59+08:00`),
        },
      },
      select: { userId: true, duration: true },
    });
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.userId, (map.get(row.userId) ?? 0) + row.duration);
    }

    const multi = r.multi();
    multi.del(key);
    for (const [uid, sec] of map) {
      multi.zadd(key, Math.round(sec / 60), uid);
    }
    multi.set(buildKey, toCstIso(), 'EX', CACHE_TTL);
    await multi.exec();
  }
}
