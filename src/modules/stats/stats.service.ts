import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toCstDate, toWeekStart } from '../../common/utils/time.util';

const CHECKIN_MIN_SEC = 300;

interface DayAgg {
  date: string;
  totalDurationSec: number;
  totalDistanceKm: number;
  recordCount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  // ⑳ GET /stats/weekly?date=（date 所在自然周，周一为起点）
  async weekly(userId: string, dateStr?: string) {
    const ref = dateStr ? new Date(`${dateStr}T12:00:00+08:00`) : new Date();
    const weekStart = toWeekStart(ref);
    const days: DayAgg[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(`${weekStart}T12:00:00+08:00`);
      d.setDate(d.getDate() + i);
      days.push({
        date: toCstDate(d),
        totalDurationSec: 0,
        totalDistanceKm: 0,
        recordCount: 0,
      });
    }
    const last = days[6].date;

    const records = await this.prisma.exerciseRecord.findMany({
      where: {
        userId,
        isCompleted: true,
        startTime: {
          gte: new Date(`${weekStart}T00:00:00+08:00`),
          lte: new Date(`${last}T23:59:59+08:00`),
        },
      },
      select: { startTime: true, duration: true, distance: true },
    });
    for (const r of records) {
      const ds = toCstDate(r.startTime);
      const day = days.find((d) => d.date === ds);
      if (day) {
        day.totalDurationSec += r.duration;
        day.totalDistanceKm += r.distance;
        day.recordCount++;
      }
    }

    const checked = await this.checkedSet(userId, weekStart, last);
    const checkedDays = days.filter((d) => checked.has(d.date)).length;
    const summary = {
      totalDurationSec: days.reduce((s, d) => s + d.totalDurationSec, 0),
      totalDistanceKm: round2(days.reduce((s, d) => s + d.totalDistanceKm, 0)),
      recordCount: days.reduce((s, d) => s + d.recordCount, 0),
      checkedDays,
    };
    return {
      weekStart,
      days: days.map((d) => ({
        ...d,
        totalDistanceKm: round2(d.totalDistanceKm),
      })),
      summary,
    };
  }

  // ㉑ GET /stats/monthly?date=（按周聚合 4–5 个 bucket，键=每周周一）
  async monthly(userId: string, dateStr?: string) {
    const ref = dateStr ? new Date(`${dateStr}T12:00:00+08:00`) : new Date();
    const [y, m] = toCstDate(ref).split('-').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    const daysInMonth = new Date(y, m, 0).getDate();
    const monthStart = `${y}-${pad(m)}-01`;
    const monthEnd = `${y}-${pad(m)}-${pad(daysInMonth)}`;

    const dayMap = new Map<string, DayAgg>();
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${pad(m)}-${pad(d)}`;
      dayMap.set(ds, {
        date: ds,
        totalDurationSec: 0,
        totalDistanceKm: 0,
        recordCount: 0,
      });
    }

    const records = await this.prisma.exerciseRecord.findMany({
      where: {
        userId,
        isCompleted: true,
        startTime: {
          gte: new Date(`${monthStart}T00:00:00+08:00`),
          lte: new Date(`${monthEnd}T23:59:59+08:00`),
        },
      },
      select: { startTime: true, duration: true, distance: true },
    });
    for (const r of records) {
      const ds = toCstDate(r.startTime);
      const day = dayMap.get(ds);
      if (day) {
        day.totalDurationSec += r.duration;
        day.totalDistanceKm += r.distance;
        day.recordCount++;
      }
    }

    const weekMap = new Map<string, DayAgg>();
    for (const day of dayMap.values()) {
      const ws = toWeekStart(new Date(`${day.date}T12:00:00+08:00`));
      const bucket = weekMap.get(ws) ?? {
        date: ws,
        totalDurationSec: 0,
        totalDistanceKm: 0,
        recordCount: 0,
      };
      bucket.totalDurationSec += day.totalDurationSec;
      bucket.totalDistanceKm += day.totalDistanceKm;
      bucket.recordCount += day.recordCount;
      weekMap.set(ws, bucket);
    }
    const weeks = [...weekMap.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({ ...w, totalDistanceKm: round2(w.totalDistanceKm) }));

    const checked = await this.checkedSet(userId, monthStart, monthEnd);
    const checkedDays = [...dayMap.values()].filter((d) =>
      checked.has(d.date),
    ).length;
    const summary = {
      totalDurationSec: weeks.reduce((s, w) => s + w.totalDurationSec, 0),
      totalDistanceKm: round2(weeks.reduce((s, w) => s + w.totalDistanceKm, 0)),
      recordCount: weeks.reduce((s, w) => s + w.recordCount, 0),
      checkedDays,
    };
    return { weeks, summary };
  }

  /** 区间内打卡日期集合（达标 walkDog 记录 ∪ 补签覆盖）。 */
  private async checkedSet(
    userId: string,
    start: string,
    end: string,
  ): Promise<Set<string>> {
    const [records, makeups] = await Promise.all([
      this.prisma.exerciseRecord.findMany({
        where: {
          userId,
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
}
