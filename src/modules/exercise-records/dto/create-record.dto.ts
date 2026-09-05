import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/** GeoPoint 入参（契约 §三）。 */
export class GeoPointDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsDateString()
  timestamp!: string;

  @IsNumber()
  @IsOptional()
  accuracy?: number;
}

/** 上报运动记录入参（契约 §4.6 ⑭：去掉 id/userId/createdAt）。 */
export class CreateRecordDto {
  @IsString()
  clientRecordId!: string;

  @IsString()
  petId!: string;

  @IsEnum(['walkDog', 'catPlay'])
  type!: 'walkDog' | 'catPlay';

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsInt()
  @Min(0)
  duration!: number;

  @IsNumber()
  @Min(0)
  distance!: number;

  @IsInt()
  @Min(0)
  steps!: number;

  @IsString()
  @IsOptional()
  locationName?: string;

  @IsString()
  @IsOptional()
  startPhotoUrl?: string | null;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsBoolean()
  @IsOptional()
  isManual?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeoPointDto)
  @IsOptional()
  route?: GeoPointDto[];
}
