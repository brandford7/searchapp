// src/auth/entities/temporary-access.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('temporary_access')
export class TemporaryAccess {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  token!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  // CHANGE: Track number of uses instead of boolean
  @Column({ type: 'int', default: 0 })
  usageCount!: number;

  @Column({ type: 'int', default: 2 })
  maxUsages!: number; // Allow 2 uses

  @Column({ type: 'timestamp', nullable: true })
  firstUsedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'simple-array', nullable: true })
  ipAddresses!: string[]; // Track all IPs that used this token

  @CreateDateColumn()
  createdAt!: Date;
}
