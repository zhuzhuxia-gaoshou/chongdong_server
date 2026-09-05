import { Injectable } from '@nestjs/common';
import {
  BusinessException,
  ErrorCodes,
} from '../../common/constants/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PetDto, serializePet } from '../../common/serializers/pet.serializer';
import { genId } from '../../common/utils/id.util';
import { CreatePetDto } from './dto/create-pet.dto';
import { QueryPetsDto } from './dto/query-pets.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

/** 单用户宠物上限（契约 §4.4 ⑨：20 只）。 */
const PET_LIMIT = 20;

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  // ⑨ POST /pets
  async create(userId: string, dto: CreatePetDto): Promise<PetDto> {
    const count = await this.prisma.pet.count({
      where: { userId, deletedAt: null },
    });
    if (count >= PET_LIMIT) {
      throw new BusinessException(ErrorCodes.PET_LIMIT_EXCEEDED);
    }
    const pet = await this.prisma.pet.create({
      data: {
        id: genId('p_'),
        userId,
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        gender: dto.gender,
        ageYears: dto.ageYears ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        weight: dto.weight,
        avatarUrl: dto.avatarUrl ?? null,
        allergies: dto.allergies ?? [],
        chronicConditions: dto.chronicConditions ?? [],
        isNeutered: dto.isNeutered ?? false,
        isVaccinated: dto.isVaccinated ?? false,
        emergencyContact: dto.emergencyContact ?? null,
      },
    });
    return serializePet(pet);
  }

  // ⑧ GET /pets
  async list(userId: string, q: QueryPetsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 100;
    const where = { userId, deletedAt: null };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.pet.count({ where }),
      this.prisma.pet.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // 创建时间正序（第一只为默认宠物）
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      list: rows.map(serializePet),
      total,
      page,
      pageSize,
    };
  }

  // ⑩ GET /pets/:petId
  async getOne(userId: string, petId: string): Promise<PetDto> {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.deletedAt) {
      throw new BusinessException(ErrorCodes.PET_NOT_FOUND);
    }
    if (pet.userId !== userId) {
      throw new BusinessException(ErrorCodes.NOT_PET_OWNER);
    }
    return serializePet(pet);
  }

  // ⑪ PATCH /pets/:petId
  async update(
    userId: string,
    petId: string,
    dto: UpdatePetDto,
  ): Promise<PetDto> {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.deletedAt) {
      throw new BusinessException(ErrorCodes.PET_NOT_FOUND);
    }
    if (pet.userId !== userId) {
      throw new BusinessException(ErrorCodes.NOT_PET_OWNER);
    }
    const updated = await this.prisma.pet.update({
      where: { id: petId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.species !== undefined ? { species: dto.species } : {}),
        ...(dto.breed !== undefined ? { breed: dto.breed } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.ageYears !== undefined ? { ageYears: dto.ageYears } : {}),
        ...(dto.birthDate !== undefined
          ? { birthDate: dto.birthDate ? new Date(dto.birthDate) : null }
          : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.allergies !== undefined ? { allergies: dto.allergies } : {}),
        ...(dto.chronicConditions !== undefined
          ? { chronicConditions: dto.chronicConditions }
          : {}),
        ...(dto.isNeutered !== undefined ? { isNeutered: dto.isNeutered } : {}),
        ...(dto.isVaccinated !== undefined
          ? { isVaccinated: dto.isVaccinated }
          : {}),
        ...(dto.emergencyContact !== undefined
          ? { emergencyContact: dto.emergencyContact }
          : {}),
      },
    });
    return serializePet(updated);
  }

  // ⑫ DELETE /pets/:petId（软删除：记录保留供历史周报，列表不再出现）
  async remove(userId: string, petId: string): Promise<void> {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.deletedAt) {
      throw new BusinessException(ErrorCodes.PET_NOT_FOUND);
    }
    if (pet.userId !== userId) {
      throw new BusinessException(ErrorCodes.NOT_PET_OWNER);
    }
    await this.prisma.pet.update({
      where: { id: petId },
      data: { deletedAt: new Date() },
    });
  }
}
