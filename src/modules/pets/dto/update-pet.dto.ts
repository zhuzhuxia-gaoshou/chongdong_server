import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** 编辑宠物入参（契约 §4.4 ⑪：均可选）。 */
export class UpdatePetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['dog', 'cat'])
  @IsOptional()
  species?: 'dog' | 'cat';

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(['male', 'female'])
  @IsOptional()
  gender?: 'male' | 'female';

  @IsInt()
  @IsOptional()
  ageYears?: number | null;

  @IsString()
  @IsOptional()
  birthDate?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

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
