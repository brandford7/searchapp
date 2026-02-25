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
import { Session } from './entities/session.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TemporaryAccess)
    private temporaryAccessRepository: Repository<TemporaryAccess>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private jwtService: JwtService,
  ) {}

  /**
   * Admin Login - Admins can have multiple sessions simultaneously
   */
  async adminLogin(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
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

    // Admins can have multiple sessions - no session invalidation
    return this.generateJwtToken(user, false, ipAddress, userAgent, false);
  }

  /**
   * Generate temporary access token that can be used twice
   */
  async generateTemporaryAccess(dto: GenerateTemporaryAccessDto) {
    // Find or create temporary user
    let user = await this.userRepository.findOne({
      where: { username: dto.username, role: UserRole.TEMPORARY },
    });

    if (!user) {
      user = this.userRepository.create({
        username: dto.username,
        role: UserRole.TEMPORARY,
        isActive: true,
      });
      await this.userRepository.save(user);
    }

    // Generate unique token
    const token = this.generateSecureToken();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + dto.expiresInHours);

    // Create temporary access record with 2 max usages
    const temporaryAccess = this.temporaryAccessRepository.create({
      token,
      user,
      userId: user.id,
      expiresAt,
      usageCount: 0,
      maxUsages: 2, // Allow 2 uses
      ipAddresses: [],
      firstUsedAt: null,
      lastUsedAt: null,
    });

    await this.temporaryAccessRepository.save(temporaryAccess);

    return {
      token,
      expiresAt,
      maxUsages: 2,
      loginUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/temporary-login?token=${token}`
        : undefined,
    };
  }

  /**
   * Temporary token login - Can be used twice, enforces single active session
   */
  async temporaryLogin(token: string, ipAddress?: string, userAgent?: string) {
    // Find the temporary access token
    const temporaryAccess = await this.temporaryAccessRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!temporaryAccess) {
      throw new UnauthorizedException('Invalid token');
    }

    // Check if token has expired
    if (new Date() > temporaryAccess.expiresAt) {
      throw new UnauthorizedException('Token has expired');
    }

    // Check if maximum usages reached
    if (temporaryAccess.usageCount >= temporaryAccess.maxUsages) {
      throw new UnauthorizedException(
        `This link has already been used ${temporaryAccess.maxUsages} times and cannot be used again`,
      );
    }

    // Check if user account is active
    if (!temporaryAccess.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Increment usage count
    temporaryAccess.usageCount += 1;
    temporaryAccess.lastUsedAt = new Date();

    // Set first used timestamp on first use
    if (temporaryAccess.usageCount === 1) {
      temporaryAccess.firstUsedAt = new Date();
    }

    // Track IP addresses
    if (ipAddress) {
      const ipAddresses = temporaryAccess.ipAddresses || [];
      if (!ipAddresses.includes(ipAddress)) {
        ipAddresses.push(ipAddress);
      }
      temporaryAccess.ipAddresses = ipAddresses;
    }

    // Save updated usage info
    await this.temporaryAccessRepository.save(temporaryAccess);

    // Calculate remaining usages
    const remainingUsages =
      temporaryAccess.maxUsages - temporaryAccess.usageCount;

    // CRITICAL: Invalidate all other sessions for this temporary user
    await this.invalidateAllUserSessions(temporaryAccess.user.id);

    // Generate JWT with shorter expiration for temporary users
    const authResponse = await this.generateJwtToken(
      temporaryAccess.user,
      true,
      ipAddress,
      userAgent,
      true, // Enforce single session for temporary users
    );

    return {
      ...authResponse,
      usageInfo: {
        usageCount: temporaryAccess.usageCount,
        maxUsages: temporaryAccess.maxUsages,
        remainingUsages,
        message:
          remainingUsages > 0
            ? `You have ${remainingUsages} login${remainingUsages > 1 ? 's' : ''} remaining with this link`
            : 'This was your last login with this link',
      },
    };
  }

  /**
   * Invalidate all active sessions for a specific user
   */
  private async invalidateAllUserSessions(userId: string) {
    // Deactivate all existing sessions for this user
    await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );

    // Clear current session token from user
    await this.userRepository.update(
      { id: userId },
      { currentSessionToken: null },
    );
  }

  /**
   * Generate JWT token and create session record
   */
  private async generateJwtToken(
    user: User,
    isTemporary = false,
    ipAddress?: string,
    userAgent?: string,
    enforceSingleSession = false,
  ) {
    // Generate unique session identifier
    const sessionId = randomBytes(16).toString('hex');

    // Create JWT payload
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      sessionId,
    };

    // Set expiration time
    const expiresIn = isTemporary ? '2h' : '24h';
    const access_token = this.jwtService.sign(payload, { expiresIn });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (isTemporary ? 2 : 24));

    // Enforce single session for temporary users
    if (enforceSingleSession) {
      await this.invalidateAllUserSessions(user.id);
    }

    // FIX: Create new session record - remove .create() and just use save()
    const session = new Session();
    session.token = sessionId;
    session.user = user;
    session.userId = user.id;
    session.ipAddress = ipAddress || null;
    session.userAgent = userAgent || null;
    session.expiresAt = expiresAt;
    session.isActive = true;

    await this.sessionRepository.save(session);

    // Update user's current session token and last login time
    await this.userRepository.update(
      { id: user.id },
      {
        currentSessionToken: sessionId,
        lastLoginAt: new Date(),
      },
    );

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      expiresIn,
      sessionId,
    };
  }

  /**
   * Generate cryptographically secure random token
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Validate user and their active session
   */
  async validateUser(userId: string, sessionId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // For temporary users, strictly validate the session
    if (user.role === UserRole.TEMPORARY) {
      const session = await this.sessionRepository.findOne({
        where: { token: sessionId, userId, isActive: true },
      });

      if (!session) {
        throw new UnauthorizedException(
          'Session is no longer valid. Another user has logged in.',
        );
      }

      // Check if session has expired
      if (new Date() > session.expiresAt) {
        await this.sessionRepository.update(
          { id: session.id },
          { isActive: false },
        );
        throw new UnauthorizedException('Session has expired');
      }
    }

    return user;
  }

  /**
   * Logout - Invalidate current session
   */
  async logout(userId: string, sessionId: string) {
    // Deactivate the session
    await this.sessionRepository.update(
      { token: sessionId, userId },
      { isActive: false },
    );

    // Clear current session token from user
    await this.userRepository.update(
      { id: userId },
      { currentSessionToken: null },
    );

    return { message: 'Logged out successfully' };
  }

  /**
   * Cleanup expired sessions (run periodically via cron)
   */
  async cleanupExpiredSessions() {
    const result = await this.sessionRepository.update(
      { expiresAt: LessThan(new Date()), isActive: true },
      { isActive: false },
    );
    return result.affected || 0;
  }

  /**
   * Cleanup expired temporary access tokens (run periodically via cron)
   */
  async cleanupExpiredTokens() {
    const result = await this.temporaryAccessRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  /**
   * Get session statistics (optional - for admin dashboard)
   */
  async getSessionStats() {
    const totalSessions = await this.sessionRepository.count();
    const activeSessions = await this.sessionRepository.count({
      where: { isActive: true },
    });
    const activeTemporarySessions = await this.sessionRepository
      .createQueryBuilder('session')
      .innerJoin('session.user', 'user')
      .where('session.isActive = :isActive', { isActive: true })
      .andWhere('user.role = :role', { role: UserRole.TEMPORARY })
      .getCount();

    return {
      totalSessions,
      activeSessions,
      activeTemporarySessions,
    };
  }
}
