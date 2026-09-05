import type { Pet } from '@prisma/client';
import { toCstDate } from '../utils/time.util';

/** PetDTO（契约 §三）：出网字段名与前端 Dart 模型一致。 */
export interface PetDto {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  gender: 'male' | 'female';
  ageYears: number | null;
  birthDate: string | null; // yyyy-MM-dd
  weight: number;
  avatarUrl: string | null;
  allergies: string[];
  chronicConditions: string[];
  isNeutered: boolean;
  isVaccinated: boolean;
  emergencyContact: string | null;
  recommendedExerciseMinutes: number; // 服务端按公式计算下发
}

// 品种关键字（契约 §三 PetDTO 公式）
const SMALL_DOG = ['柯基', '法斗', '吉娃娃'];
const LARGE_DOG = ['金毛', '拉布拉多', '边牧'];

/** 由 ageYears 或 birthDate 推导年龄（岁）。 */
function computeAge(pet: Pet): number | null {
  if (pet.ageYears != null) return pet.ageYears;
  if (!pet.birthDate) return null;
  const now = new Date();
  const b = new Date(pet.birthDate);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age < 0 ? 0 : age;
}

/**
 * 推荐运动分钟数（契约 §三 PetDTO 公式，与前端 getter 一致，两侧不可各自私改）。
 * cat: 15 + (age<2 ? 15 : age>7 ? -5 : 0)
 * 小型犬(柯基/法斗/吉娃娃): age<1 ? 20 : age>8 ? 15 : 30
 * 大型犬(金毛/拉布拉多/边牧): age<1 ? 40 : age>8 ? 30 : 60
 * 其他狗: age<1 ? 25 : age>8 ? 20 : 40
 */
export function recommendedExerciseMinutes(pet: Pet): number {
  const age = computeAge(pet);
  if (age == null) return 30; // 年龄未知兜底
  if (pet.species === 'cat') {
    return 15 + (age < 2 ? 15 : age > 7 ? -5 : 0);
  }
  const breed = pet.breed;
  if (SMALL_DOG.some((k) => breed.includes(k))) {
    return age < 1 ? 20 : age > 8 ? 15 : 30;
  }
  if (LARGE_DOG.some((k) => breed.includes(k))) {
    return age < 1 ? 40 : age > 8 ? 30 : 60;
  }
  return age < 1 ? 25 : age > 8 ? 20 : 40;
}

export function serializePet(pet: Pet): PetDto {
  const allergies = Array.isArray(pet.allergies)
    ? (pet.allergies as string[])
    : [];
  const chronic = Array.isArray(pet.chronicConditions)
    ? (pet.chronicConditions as string[])
    : [];
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    ageYears: pet.ageYears,
    birthDate: pet.birthDate ? toCstDate(pet.birthDate) : null,
    weight: pet.weight,
    avatarUrl: pet.avatarUrl,
    allergies,
    chronicConditions: chronic,
    isNeutered: pet.isNeutered,
    isVaccinated: pet.isVaccinated,
    emergencyContact: pet.emergencyContact,
    recommendedExerciseMinutes: recommendedExerciseMinutes(pet),
  };
}
