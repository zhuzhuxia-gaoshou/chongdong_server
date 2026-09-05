import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { ulid } from 'ulid';
import {
  BusinessException,
  ErrorCodes,
} from '../../common/constants/error-codes';

export type BusinessType = 'avatar' | 'walkPhoto';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const LIMIT_ENV: Record<BusinessType, string> = {
  avatar: 'UPLOAD_AVATAR_MAX_BYTES',
  walkPhoto: 'UPLOAD_WALKPHOTO_MAX_BYTES',
};

/**
 * 文件上传（契约 §4.5 ⑬）：本地磁盘存储 + 静态目录托管。
 * 前端只认返回的 URL；后续可平滑替换为腾讯云 COS（同 URL 形态）。
 */
@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {}

  async save(
    file: Express.Multer.File,
    businessType: BusinessType,
  ): Promise<{ url: string; fileSize: number }> {
    const ext = MIME_EXT[file.mimetype];
    if (!ext) {
      throw new BusinessException(ErrorCodes.UNSUPPORTED_MEDIA_TYPE);
    }
    const maxBytes = this.config.get<number>(LIMIT_ENV[businessType]);
    if (maxBytes && file.size > maxBytes) {
      throw new BusinessException(ErrorCodes.FILE_TOO_LARGE);
    }

    const dir = join(process.cwd(), 'uploads', businessType);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const filename = `${ulid()}.${ext}`;
    await writeFile(join(dir, filename), file.buffer);

    const base = this.config.get<string>(
      'PUBLIC_BASE_URL',
      'http://localhost:8080',
    );
    return {
      url: `${base}/static/${businessType}/${filename}`,
      fileSize: file.size,
    };
  }
}
