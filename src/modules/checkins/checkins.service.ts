import { Injectable } from '@nestjs/common';
import {
  BusinessException,
  ErrorCodes,
} from '../../common/constants/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toCstDate } from '../../common/utils/time.util';

/** 打卡判定阈值（契约 §4.7：walkDog && isCompleted && duration≥300秒）。 */
const CHECKIN_MIN_SEC = 300;

@Injectable()
export class CheckinsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 某区间内已打卡日期集合（自然打卡 ∪ 补签覆盖）。 */
  private async checkedDateSet(
    userId: string,
    start: string,
    end: string,
  ): Promise<Set<string>> {
    const [records, makeups] = await Promise.all([
      this.prisma.exerciseRecord.findMany({
        where: {
          userId,
          type: 'walkDog',
          isCompleted: true,
          duration: { gte: CHECKIN_MIN_SEC },
          startTime: {
            gte: new Date(`${start}T00:00:00+08:00`),
            lte: new Date(`${end}T23:59:59+08:00`),
          },
        },
        select: { startTime: true },
      }),
      this.prisma.makeupCheckin.findMany({
        where: { userId, date: { gte: start, lte: end } },
        select: { date: true },
      }),
    ]);
    return new Set([
      ...records.map((r) => toCstDate(r.startTime)),
      ...makeups.map((m) => m.date),
    ]);
  }

  // ⑰ GET /checkins/calendar
  async calendar(userId: string, year: number, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month)}-01`;
    const end = `${year}-${pad(month)}-${pad(daysInMonth)}`;
    const checked = await this.checkedDateSet(userId, start, end);

    const days: { date: string; isChecked: boolean }[] = [];
    let monthCheckedCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${pad(month)}-${pad(d)}`;
      const isChecked = checked.has(ds);
      if (isChecked) monthCheckedCount++;
      days.push({ date: ds, isChecked });
    }
    return {
      days,
      monthCheckedCount,
      streakDays: await this.computeStreak(userId),
    };
  }

  // ⑱ GET /checkins/today
  async today(userId: string) {
    const today = toCstDate();
    const checked = await this.checkedDateSet(userId, today, today);
    const recs = await this.prisma.exerciseRecord.findMany({
      where: {
        userId,
        isCompleted: true,
        startTime: {
          gte: new Date(`${today}T00:00:00+08:00`),
          lte: new Date(`${today}T23:59:59+08:00`),
        },
      },
      select: { duration: true },
    });
    const todayMinutes = Math.round(
      recs.reduce((sum, r) => sum + r.duration, 0) / 60,
    );
    return { isChecked: checked.has(today), todayMinutes };
  }

  // ⑲ POST /checkins/makeup
  async makeup(userId: string, date: string) {
    const today = toCstDate();
    if (date > today) {
      throw new BusinessException(ErrorCodes.INVALID_PARAM, '日期不能晚于今天');
    }
    const checked = await this.checkedDateSet(userId, date, date);
    if (checked.has(date)) {
      throw new BusinessException(ErrorCodes.NO_NEED_MAKEUP);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BusinessException(ErrorCodes.NOT_FOUND);
    if (user.signCardCount <= 0) {
      throw new BusinessException(ErrorCodes.MAKEUP_CARD_INSUFFICIENT);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { signCardCount: { decrement: 1 } },
      }),
      this.prisma.makeupCheckin.create({ data: { userId, date } }),
    ]);
    const refreshed = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return { date, isChecked: true, signCardCount: refreshed!.signCardCount };
  }

  /** 截至今天向前数连续打卡天数（今天未打卡则断为 0）。 */
  private async computeStreak(userId: string): Promise<number> {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = toCstDate(d);
      const checked = await this.checkedDateSet(userId, ds, ds);
      if (checked.has(ds)) streak++;
      else break;
    }
    // 持久化 streakDays 供徽章/排行读取
    await this.prisma.user.update({
      where: { id: userId },
      data: { streakDays: streak },
    });
    return streak;
  }
}
