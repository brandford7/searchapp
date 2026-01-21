/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/people/people.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import {
  SearchPersonDto,
  PaginatedPersonResultDto,
} from './dto/search-person.dto';
import { Person } from './entities/person.entity';

@ApiTags('people')
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for people by various criteria' })
  async search(
    @Query() searchDto: SearchPersonDto,
  ): Promise<PaginatedPersonResultDto> {
    return this.peopleService.search(searchDto);
  }

  @Get('states')
  @ApiOperation({ summary: 'Get all states in database' })
  async getStates(): Promise<string[]> {
    return this.peopleService.getStates();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get database statistics' })
  async getStats() {
    return this.peopleService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get person by ID' })
  async findById(@Param('id') id: number): Promise<Person> {
    return this.peopleService.findById(id);
  }
}
