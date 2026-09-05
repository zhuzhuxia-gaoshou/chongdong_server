import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

/** 新增宠物入参（契约 §4.4 ⑨：name/species/breed/gender/weight/birthDate 必填）。 */
export class CreatePetDto {
  @IsString()
  @Length(1, 10) // DB 列 VarChar(10)
  name!: string;

  @IsEnum(['dog', 'cat'])
  species!: 'dog' | 'cat';

  @IsString()
  breed!: string;

  @IsEnum(['male', 'female'])
  gender!: 'male' | 'female';

  @IsInt()
  @IsOptional()
  ageYears?: number;

  @IsString()
  birthDate!: string; // yyyy-MM-dd（契约：必填）

  @IsNumber()
  @IsPositive() // 契约：weight > 0
  weight!: number;

  @IsString()
  @IsOptional()
  avatarUrl?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronicConditions?: string[];

  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @IsBoolean()
  @IsOptional()
  isVaccinated?: boolean;

  @IsString()
  @IsOptional()
  emergencyContact?: string | null;
}
