import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Ip,
  Headers,
  Request,
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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/login')
  async adminLogin(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.adminLogin(loginDto, ip, userAgent);
  }

  @Post('temporary/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async generateTemporaryAccess(@Body() dto: GenerateTemporaryAccessDto) {
    return this.authService.generateTemporaryAccess(dto);
  }

  @Post('temporary/login')
  async temporaryLogin(
    @Body() dto: TemporaryLoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.temporaryLogin(dto.token, ip, userAgent);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.userId, req.user.sessionId);
    return { message: 'Logged out successfully' };
  }
}
