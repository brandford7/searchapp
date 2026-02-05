// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  TemporaryLoginDto,
  GenerateTemporaryAccessDto,
} from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RequestWithUser } from '../common/interfaces/auth.interfaces';

@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/login')
  async adminLogin(@Body() loginDto: LoginDto) {
    return this.authService.adminLogin(loginDto);
  }

  @Post('temporary/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async generateTemporaryAccess(@Body() dto: GenerateTemporaryAccessDto) {
    return this.authService.generateTemporaryAccess(dto);
  }

  @Post('temporary/login')
  async temporaryLogin(@Body() dto: TemporaryLoginDto, @Ip() ip: string) {
    return this.authService.temporaryLogin(dto.token, ip);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }
}
