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

  @Column({ default: false })
  isUsed!: boolean;

  @Column({ nullable: true })
  usedAt!: Date;

  @Column({ nullable: true })
  ipAddress!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
