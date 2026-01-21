/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/people/dto/search-person.dto.ts
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPersonDto {
  @ApiProperty({ required: false, description: 'First name' })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiProperty({ required: false, description: 'Last name' })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiProperty({ required: false, description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'State (2 letter code)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false, description: 'ZIP code' })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiProperty({ required: false, description: 'SSN' })
  @IsOptional()
  @IsString()
  ssn?: string;

  @ApiProperty({ required: false, description: 'Date of Birth' })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class PersonResultDto {
  id!: number;
  firstname!: string;
  lastname!: string;
  middlename!: string;
  name_suff!: string;
  dob!: string;
  address!: string;
  city!: string;
  county_name!: string;
  st!: string;
  zip!: string;
  ssn!: string;
  phone1!: string;
}

export class PaginatedPersonResultDto {
  data!: PersonResultDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
