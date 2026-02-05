import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { SearchPersonDto, SearchResultDto } from './dto/search-person.dto';
import { Controller, Get, Query /* UseGuards*/ } from '@nestjs/common';
//import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@ApiTags('people')
@Controller('people')
//@UseGuards(JwtAuthGuard)
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search people using full-text search',
    description:
      'Returns only firstname, lastname, and ssn. Uses search vectors for instant results.',
  })
  async search(@Query() searchDto: SearchPersonDto): Promise<SearchResultDto> {
    return this.peopleService.search(searchDto);
  }
}
