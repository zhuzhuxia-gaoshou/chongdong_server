import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsIn, IsString } from 'class-validator';
import {
  BusinessException,
  ErrorCodes,
} from '../../common/constants/error-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

class UploadDto {
  @IsString()
  @IsIn(['avatar', 'walkPhoto'])
  businessType!: 'avatar' | 'walkPhoto';
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDto,
  ) {
    if (!file) {
      throw new BusinessException(ErrorCodes.INVALID_PARAM, 'file is required');
    }
    return this.upload.save(file, dto.businessType);
  }
}
