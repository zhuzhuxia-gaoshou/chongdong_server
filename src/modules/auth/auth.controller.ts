import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService, LoginResult, TokenBundle } from './auth.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('sms-code')
  @HttpCode(200)
  async smsCode(@Body() dto: SendSmsDto): Promise<null> {
    await this.auth.sendSmsCode(dto.phone);
    return null; // data: {}
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.auth.login(dto.phone, dto.smsCode);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto): Promise<TokenBundle> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Body() dto: RefreshDto): Promise<null> {
    await this.auth.logout(dto.refreshToken);
    return null;
  }
}
