import type { ExerciseRecord, RoutePoint } from '@prisma/client';
import { toCstIso } from '../utils/time.util';

/** GeoPoint（契约 §三）：WGS-84，保留 6 位小数。 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number | null;
}

/** ExerciseRecordDTO（契约 §三）：出网 startPhotoUrl（模型字段同名）。 */
export interface ExerciseRecordDto {
  id: string;
  clientRecordId: string;
  petId: string;
  userId: string;
  type: 'walkDog' | 'catPlay';
  catPlayType: string | null; // 猫玩玩法，仅 type=catPlay 有值
  startTime: string;
  endTime: string;
  duration: number; // 秒
  distance: number; // 公里，两位小数
  steps: number;
  route: GeoPoint[];
  locationName: string | null;
  startPhotoUrl: string | null;
  isCompleted: boolean;
  isManual: boolean;
  createdAt: string;
  /** 幂等命中时附加（契约 §4.6 ⑭） */
  duplicated?: boolean;
}

export function serializeRoutePoint(rp: RoutePoint): GeoPoint {
  return {
    latitude: Number(rp.latitude),
    longitude: Number(rp.longitude),
    timestamp: toCstIso(rp.timestamp),
    accuracy: rp.accuracy ?? null,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 序列化运动记录。
 * opts.thinned：列表场景按每 50 点取 1（契约 §4.6 ⑮）以控流量，并保留末点。
 * opts.duplicated：幂等命中标记。
 */
export function serializeRecord(
  rec: ExerciseRecord & { route?: RoutePoint[] },
  opts: { thinned?: boolean; duplicated?: boolean } = {},
): ExerciseRecordDto {
  let route = (rec.route ?? []).map(serializeRoutePoint);
  if (opts.thinned && route.length > 0) {
    const N = 50;
    const picked = route.filter((_, i) => i % N === 0);
    const last = route[route.length - 1];
    if (picked[picked.length - 1] !== last) picked.push(last);
    route = picked;
  }
  const dto: ExerciseRecordDto = {
    id: rec.id,
    clientRecordId: rec.clientRecordId,
    petId: rec.petId,
    userId: rec.userId,
    type: rec.type,
    catPlayType: rec.catPlayType,
    startTime: toCstIso(rec.startTime),
    endTime: toCstIso(rec.endTime),
    duration: rec.duration,
    distance: round2(rec.distance),
    steps: rec.steps,
    route,
    locationName: rec.locationName,
    startPhotoUrl: rec.startPhotoUrl,
    isCompleted: rec.isCompleted,
    isManual: rec.isManual,
    createdAt: toCstIso(rec.createdAt),
  };
  if (opts.duplicated) dto.duplicated = true;
  return dto;
}
