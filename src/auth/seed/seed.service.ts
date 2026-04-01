// src/auth/seed/seed.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';

interface SeedResult {
  username: string;
  status: 'created' | 'exists' | 'updated';
}

interface AdminCredentials {
  username: string;
  password: string;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Seed the default ORIG admin user
   */
  async seedAdminUser(): Promise<User> {
    try {
      const existingAdmin = await this.userRepository.findOne({
        where: { username: 'Onlinemafia' },
      });

      if (existingAdmin) {
        this.logger.log(
          'Admin user "Onlinemafia" already exists. Updating password...',
        );

        const hashedPassword = await bcrypt.hash('Jesus@1234', 10);
        existingAdmin.password = hashedPassword;
        existingAdmin.isActive = true;
        existingAdmin.role = UserRole.ADMIN;

        await this.userRepository.save(existingAdmin);

        this.logger.log('✅ Admin user "Onlinemafia" updated successfully');
        return existingAdmin;
      }

      this.logger.log('Creating admin user "Onlinemafia"...');

      const hashedPassword = await bcrypt.hash('Jesus@1234', 10);

      const adminUser = this.userRepository.create({
        username: 'Onlinemafia',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      });

      await this.userRepository.save(adminUser);

      this.logger.log('✅ Admin user "Onlinemafia" created successfully');
      this.logger.log('   Username: Onlinemafia');
      //this.logger.log('   Password: Jesus@1234');
      this.logger.log('   Role: admin');

      return adminUser;
    } catch (error: any) {
      this.logger.error('❌ Error seeding admin user:', error.message);
      throw error;
    }
  }

  /**
   * Seed multiple admin users
   */
  async seedMultipleAdmins(admins: AdminCredentials[]): Promise<SeedResult[]> {
    try {
      const results: SeedResult[] = [];

      for (const admin of admins) {
        const existingUser = await this.userRepository.findOne({
          where: { username: admin.username },
        });

        if (existingUser) {
          this.logger.log(
            `Admin "${admin.username}" already exists. Skipping...`,
          );
          results.push({ username: admin.username, status: 'exists' });
          continue;
        }

        const hashedPassword = await bcrypt.hash(admin.password, 10);

        const newAdmin = this.userRepository.create({
          username: admin.username,
          password: hashedPassword,
          role: UserRole.ADMIN,
          isActive: true,
        });

        await this.userRepository.save(newAdmin);

        this.logger.log(`✅ Admin "${admin.username}" created`);
        results.push({ username: admin.username, status: 'created' });
      }

      return results;
    } catch (error: any) {
      this.logger.error('❌ Error seeding multiple admins:', error.message);
      throw error;
    }
  }

  /**
   * Get all admin users
   */
  async getAllAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: [
        'id',
        'username',
        'role',
        'isActive',
        'createdAt',
        'lastLoginAt',
      ],
    });
  }

  /**
   * Deactivate an admin user
   */
  async deactivateAdmin(username: string): Promise<void> {
    const admin = await this.userRepository.findOne({
      where: { username, role: UserRole.ADMIN },
    });

    if (!admin) {
      throw new Error(`Admin user "${username}" not found`);
    }

    admin.isActive = false;
    await this.userRepository.save(admin);

    this.logger.log(`✅ Admin "${username}" deactivated`);
  }
}
