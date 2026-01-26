// src/people/entities/person.entity.ts
import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('people')
// These match the Composite Indexes we created manually in SQL
@Index('idx_people_fullname', ['lastname', 'firstname'])
@Index('idx_people_location', ['st', 'city'])
export class Person {
  // We use PrimaryColumn because we imported existing IDs.
  // Type must be 'bigint' to handle your 2.3 billion+ IDs.
  // In JS/TS, we type this as 'string' to prevent precision loss.
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_people_firstname_gin') // Reference for documentation (GIN index created manually)
  firstname!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_people_lastname_gin')
  lastname!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  middlename!: string;

  // We widened this to 50 during the import fix
  @Column({ type: 'varchar', length: 50, nullable: true })
  name_suff!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_people_dob')
  dob!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  county_name!: string;

  // We widened this to 50 during the import fix
  @Column({ type: 'varchar', length: 50, nullable: true })
  st!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_people_zip')
  zip!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_people_ssn')
  ssn!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone1!: string;

  // Note: searchVector column removed as we switched to GIN indexes
}
