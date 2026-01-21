// src/people/entities/person.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('people')
@Index('idx_search_vector', { synchronize: false })
@Index(['firstname', 'lastname'])
export class Person {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  firstname!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  lastname!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middlename!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name_suff!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dob!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  city!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  county_name!: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  @Index()
  st!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @Index()
  zip!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ssn!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone1!: string;

  @Column({ type: 'tsvector', select: false, nullable: true })
  searchVector: any;
}
