// src/auth/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  TEMPORARY = 'temporary',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ nullable: true })
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TEMPORARY })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  // FIX: Add explicit type for currentSessionToken
  @Column({ type: 'varchar', nullable: true })
  currentSessionToken!: string | null;

  // FIX: Add explicit type for lastLoginAt
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
