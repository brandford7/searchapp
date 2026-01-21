/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/people/people.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './entities/person.entity';
import {
  SearchPersonDto,
  PaginatedPersonResultDto,
} from './dto/search-person.dto';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async search(searchDto: SearchPersonDto): Promise<PaginatedPersonResultDto> {
    const { page = 1, limit = 50 } = searchDto;
    const offset = (page - 1) * limit;

    const qb = this.personRepository.createQueryBuilder('p');

    // Build dynamic WHERE clause based on provided fields
    let hasConditions = false;

    if (searchDto.firstname) {
      qb.andWhere('LOWER(p.firstname) LIKE LOWER(:firstname)', {
        firstname: `%${searchDto.firstname}%`,
      });
      hasConditions = true;
    }

    if (searchDto.lastname) {
      qb.andWhere('LOWER(p.lastname) LIKE LOWER(:lastname)', {
        lastname: `%${searchDto.lastname}%`,
      });
      hasConditions = true;
    }

    if (searchDto.address) {
      qb.andWhere('LOWER(p.address) LIKE LOWER(:address)', {
        address: `%${searchDto.address}%`,
      });
      hasConditions = true;
    }

    if (searchDto.city) {
      qb.andWhere('LOWER(p.city) LIKE LOWER(:city)', {
        city: `%${searchDto.city}%`,
      });
      hasConditions = true;
    }

    if (searchDto.state) {
      qb.andWhere('LOWER(p.st) = LOWER(:state)', {
        state: searchDto.state,
      });
      hasConditions = true;
    }

    if (searchDto.zip) {
      qb.andWhere('p.zip LIKE :zip', {
        zip: `%${searchDto.zip}%`,
      });
      hasConditions = true;
    }

    if (searchDto.ssn) {
      qb.andWhere('p.ssn LIKE :ssn', {
        ssn: `%${searchDto.ssn}%`,
      });
      hasConditions = true;
    }

    if (searchDto.dob) {
      qb.andWhere('p.dob = :dob', {
        dob: searchDto.dob,
      });
      hasConditions = true;
    }

    // If no conditions provided, return empty result
    if (!hasConditions) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Order by lastname, firstname
    qb.orderBy('p.lastname', 'ASC')
      .addOrderBy('p.firstname', 'ASC')
      .skip(offset)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Person> {
    const person = await this.personRepository.findOneBy({ id });
    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    return person;
  }
  async getStates(): Promise<string[]> {
    const result = await this.personRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.st', 'st')
      .where('p.st IS NOT NULL')
      .orderBy('p.st', 'ASC')
      .getRawMany();

    //original
    // return result.map((r) => r.st);
    return result.map((r: Person) => r.st);
  }

  async getStats(): Promise<any> {
    const total = await this.personRepository.count();
    const states = await this.personRepository
      .createQueryBuilder('p')
      .select('p.st', 'state')
      .addSelect('COUNT(*)', 'count')
      .where('p.st IS NOT NULL')
      .groupBy('p.st')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      totalRecords: total,
      recordsByState: states,
    };
  }
}
