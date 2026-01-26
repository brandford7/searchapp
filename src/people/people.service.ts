import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './entities/person.entity';
import { SearchPersonDto, SearchResultDto } from './dto/search-person.dto';

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async search(searchDto: SearchPersonDto): Promise<SearchResultDto> {
    const startTime = Date.now();
    const {
      firstname,
      lastname,
      middlename,
      dob,
      address,
      city,
      st,
      zip,
      page = 1,
      limit = 100,
    } = searchDto;

    const offset = (page - 1) * limit;
    const qb = this.personRepository.createQueryBuilder('p');

    // --- Selection (Always include ID) ---
    qb.select([
      'p.id',
      'p.firstname',
      'p.lastname',
      'p.middlename',
      'p.ssn',
      'p.dob',
      'p.address',
      'p.city',
      'p.st',
      'p.zip',
    ]);

    // --- Dynamic Filters ---

    // 1. NAMES: Exact Match (Strict Equality)
    // We convert input to UpperCase because your DB data is likely UPPERCASE.
    if (firstname) {
      // Logic: Exact match only. "Jean" != "Jeanette"
      qb.andWhere('p.firstname = :firstname', {
        firstname: firstname.toUpperCase(),
      });
    }
    if (lastname) {
      qb.andWhere('p.lastname = :lastname', {
        lastname: lastname.toUpperCase(),
      });
    }

    // Middle Name can stay ILIKE if you want flexibility, or switch to = too.
    if (middlename) {
      qb.andWhere('p.middlename = :middlename', {
        middlename: middlename.toUpperCase(),
      });
    }

    // 2. DOB (Starts With - e.g. "1959")
    // We keep LIKE here so users can search by Year (1980) or Full Date (19800101)
    if (dob) {
      qb.andWhere('p.dob LIKE :dob', { dob: `${dob}%` });
    }

    // 3. Location
    if (address) {
      // Keep address fuzzy (ILIKE) because "123 Main" vs "123 Main St" is common
      qb.andWhere('p.address ILIKE :address', { address: `%${address}%` });
    }
    if (city) {
      qb.andWhere('p.city = :city', { city: city.toUpperCase() });
    }
    if (st) {
      qb.andWhere('p.st = :st', { st: st.toUpperCase() });
    }
    if (zip) {
      qb.andWhere('p.zip = :zip', { zip });
    }

    // --- Pagination ---
    qb.skip(offset).take(limit);

    // Execute
    const [results, total] = await qb.getManyAndCount();
    const searchTime = Date.now() - startTime;

    this.logger.log(`Search completed: results=${total}, time=${searchTime}ms`);

    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchTime,
    };
  }
}
