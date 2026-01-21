import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  first_name!: string;

  @Column({ nullable: true })
  middle_name!: string;

  @Column()
  last_name!: string;

  @Column({ nullable: true })
  name_suffix!: string;

  @Column({ type: 'date', nullable: true })
  dob!: Date;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ nullable: true })
  county_name!: string;

  @Column({ length: 2, nullable: true })
  state!: string;

  @Column({ nullable: true })
  zip!: string;

  @Column({ nullable: true })
  phone!: string;

  /* Normalized columns (generated in DB) */
  @Index()
  @Column({ insert: false, update: false })
  first_name_norm!: string;

  @Index()
  @Column({ insert: false, update: false })
  last_name_norm!: string;

  @Index()
  @Column({ insert: false, update: false })
  full_name_norm!: string;
}
