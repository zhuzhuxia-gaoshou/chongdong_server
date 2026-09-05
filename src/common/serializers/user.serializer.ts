import type { User } from '@prisma/client';
import { toCstIso } from '../utils/time.util';

/** UserDTO（契约 §三）：手机号脱敏（开放问题 #1）。 */
export interface UserDto {
  id: string;
  phone: string; // 脱敏 138****8000
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
  totalExerciseCount: number;
  streakDays: number;
  signCardCount: number;
  isPublicRank: boolean; // 隐私设置：公开排行榜参与开关
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function serializeUser(u: User): UserDto {
  return {
    id: u.id,
    phone: maskPhone(u.phone),
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
    createdAt: toCstIso(u.createdAt),
    totalExerciseCount: u.totalExerciseCount,
    streakDays: u.streakDays,
    signCardCount: u.signCardCount,
    isPublicRank: u.isPublicRank,
  };
}
