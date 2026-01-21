import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './user.service';
import { SearchUserDto } from './dto/search-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  search(@Query() dto: SearchUserDto) {
    return this.usersService.search(dto);
  }
}
