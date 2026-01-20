import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SearchUserDto } from './dto/search-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async search(dto: SearchUserDto) {
    const qb = this.userRepo.createQueryBuilder('u');

    if (dto.firstName) {
      qb.andWhere('u.first_name_norm LIKE :fn', {
        fn: `%${dto.firstName.toLowerCase()}%`,
      });
    }

    if (dto.lastName) {
      qb.andWhere('u.last_name_norm LIKE :ln', {
        ln: `%${dto.lastName.toLowerCase()}%`,
      });
    }

    if (dto.city) {
      qb.andWhere('lower(u.city) LIKE :city', {
        city: `%${dto.city.toLowerCase()}%`,
      });
    }

    if (dto.state) {
      qb.andWhere('u.state = :state', {
        state: dto.state.toUpperCase(),
      });
    }

    if (dto.zip) {
      qb.andWhere('u.zip = :zip', { zip: dto.zip });
    }

    if (dto.dob) {
      qb.andWhere('u.dob = :dob', { dob: dto.dob });
    }

    return qb
      .select([
        'u.id',
        'u.first_name',
        'u.middle_name',
        'u.last_name',
        'u.name_suffix',
        'u.dob',
        'u.address',
        'u.city',
        'u.county_name',
        'u.state',
        'u.zip',
        'u.phone',
      ])
      .limit(50)
      .getMany();
  }
}
