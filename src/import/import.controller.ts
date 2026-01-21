// src/import/import.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ImportService } from './import.service';

class ImportDto {
  filePath!: string;
  format!: 'csv' | 'jsonl';
}

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('file')
  @ApiOperation({ summary: 'Import data from file path' })
  async importFromFile(@Body() dto: ImportDto): Promise<{ message: string }> {
    if (dto.format === 'csv') {
      await this.importService.importFromCSV(dto.filePath);
    } else {
      await this.importService.importFromJSONL(dto.filePath);
    }
    return { message: 'Import started successfully' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get import statistics' })
  async getStats() {
    return this.importService.getImportStats();
  }
}
