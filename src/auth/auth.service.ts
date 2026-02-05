// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { TemporaryAccess } from './entities/temporary-access.entity';
import { LoginDto, GenerateTemporaryAccessDto } from './dto/login.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TemporaryAccess)
    private temporaryAccessRepository: Repository<TemporaryAccess>,
    private jwtService: JwtService,
  ) {}

  // Admin Login
  async adminLogin(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username, role: UserRole.ADMIN },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    return this.generateJwtToken(user);
  }

  // Generate temporary access token
  async generateTemporaryAccess(dto: GenerateTemporaryAccessDto) {
    // Create or find temporary user
    let user = await this.userRepository.findOne({
      where: { username: dto.username, role: UserRole.TEMPORARY },
    });

    if (!user) {
      user = this.userRepository.create({
        username: dto.username,
        role: UserRole.TEMPORARY,
      });
      await this.userRepository.save(user);
    }

    // Generate unique token
    const token = this.generateSecureToken();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + dto.expiresInHours);

    // Create temporary access record
    const temporaryAccess = this.temporaryAccessRepository.create({
      token,
      user,
      userId: user.id,
      expiresAt,
    });

    await this.temporaryAccessRepository.save(temporaryAccess);

    return {
      token,
      expiresAt,
      // Remove or make loginUrl optional
      loginUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/temporary-login?token=${token}`
        : undefined,
    };
  }

  // Temporary token login
  async temporaryLogin(token: string, ipAddress?: string) {
    const temporaryAccess = await this.temporaryAccessRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!temporaryAccess) {
      throw new UnauthorizedException('Invalid token');
    }

    if (temporaryAccess.isUsed) {
      throw new UnauthorizedException('Token has already been used');
    }

    if (new Date() > temporaryAccess.expiresAt) {
      throw new UnauthorizedException('Token has expired');
    }

    // Mark token as used
    temporaryAccess.isUsed = true;
    temporaryAccess.usedAt = new Date();
    if (ipAddress) {
      temporaryAccess.ipAddress = ipAddress;
    }
    await this.temporaryAccessRepository.save(temporaryAccess);

    // Generate JWT with shorter expiration for temporary users
    return this.generateJwtToken(temporaryAccess.user, true);
  }

  // Cleanup expired tokens (run periodically)

  private generateJwtToken(user: User, isTemporary = false) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const expiresIn = isTemporary ? '2h' : '24h'; // Shorter session for temporary users

    return {
      access_token: this.jwtService.sign(payload, { expiresIn }),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      expiresIn,
    };
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Validate JWT token
  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokensCron() {
    const result = await this.cleanupExpiredTokens();
    console.log(`🧹 Cleaned up ${result} expired tokens`);
  }

  // Update the cleanup method to return count:
  async cleanupExpiredTokens() {
    const result = await this.temporaryAccessRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
