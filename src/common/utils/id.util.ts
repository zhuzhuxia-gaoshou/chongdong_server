import { ulid } from 'ulid';

/**
 * 字符串 ID 生成器（规范 §4.4：ID 一律字符串，禁用自增数字直出）。
 * 形如 u_01J8ZK... / p_01J8ZK... / r_01J8ZK...，前缀 + ULID（26 位，含时间戳，字典序可排序）。
 */
export const IdPrefix = {
  USER: 'u_',
  PET: 'p_',
  RECORD: 'r_',
} as const;

export type IdPrefixKey = keyof typeof IdPrefix;

export function genId(prefix: string): string {
  return `${prefix}${ulid()}`;
}
