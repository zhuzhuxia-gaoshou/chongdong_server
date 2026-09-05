/**
 * 时间工具（规范 §4.4：ISO 8601 必带时区；契约：全部今日/本周/本月按东八区自然日切分）。
 * 出网一律 +08:00；纯日期字段 yyyy-MM-dd（按东八区）。
 */

function parts(
  date: Date,
  opts: Intl.DateTimeFormatOptions,
): Record<string, string> {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    ...opts,
  });
  return Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
}

/** 东八区 ISO 8601 字符串，如 2026-08-27T14:30:00+08:00 */
export function toCstIso(date: Date = new Date()): string {
  const p = parts(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+08:00`;
}

/** 东八区纯日期 yyyy-MM-dd */
export function toCstDate(date: Date = new Date()): string {
  const p = parts(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.year}-${p.month}-${p.day}`;
}

/** 所在自然周周一日期（东八区） */
export function toWeekStart(date: Date = new Date()): string {
  const p = parts(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const day = new Date(`${p.year}-${p.month}-${p.day}T00:00:00Z`);
  // weekday: short = "Mon".."Sun"，周一为起点
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const diff = map[p.weekday] ?? 0;
  day.setUTCDate(day.getUTCDate() - diff);
  return toCstDate(day);
}
