// src/people/dto/search-person.dto.ts
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPersonDto {
  // --- Name Fields ---
  @ApiPropertyOptional({
    description: 'Exact match for first name',
    example: 'Jean',
  })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({
    description: 'Exact match for last name',
    example: 'Lee',
  })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiPropertyOptional({
    description: 'Partial match for middle name',
    example: 'Marie',
  })
  @IsOptional()
  @IsString()
  middlename?: string;

  // --- Date Fields ---
  @ApiPropertyOptional({
    description: 'Date of birth (YYYYMMDD) or Year (YYYY)',
    example: '1980',
  })
  @IsOptional()
  @IsString()
  dob?: string;

  // --- Location Fields ---
  @ApiPropertyOptional({
    description: 'Partial address match',
    example: 'Main St',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City name', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State code (exact match)',
    example: 'NY',
  })
  @IsOptional()
  @IsString()
  st?: string;

  @ApiPropertyOptional({
    description: 'Zip code (exact match)',
    example: '10001',
  })
  @IsOptional()
  @IsString()
  zip?: string;

  // --- Pagination (Kept your existing settings) ---
  @ApiProperty({ required: false, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}

// --- Result DTOs (Unchanged, but included for context) ---

export class PersonResultDto {
  // Note: ID is type string in Typescript because it is bigint in DB
  id!: string;
  firstname!: string;
  lastname!: string;
  middlename!: string;
  ssn!: string;
  /*name_suff!: string;
  dob!: string;
  address!: string;
  city!: string;
  county_name!: string;
  st!: string;
  zip!: string;
  ssn!: string;
  phone1!: string;*/
}

export class SearchResultDto {
  data!: PersonResultDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
  searchTime!: number; // Added this useful metric
}
