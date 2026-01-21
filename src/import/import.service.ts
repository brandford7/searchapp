/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/import/import.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import * as readline from 'readline';
import { Person } from '../people/entities/person.entity';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly BATCH_SIZE = 5000;

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async importFromCSV(filePath: string): Promise<void> {
    this.logger.log(`Starting CSV import from ${filePath}`);
    let batch: Partial<Person>[] = [];
    let totalProcessed = 0;

    const parser = createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }),
    );

    for await (const row of parser) {
      batch.push(this.mapRowToPerson(row));

      if (batch.length >= this.BATCH_SIZE) {
        await this.saveBatch(batch);
        totalProcessed += batch.length;
        this.logger.log(`Processed ${totalProcessed} records`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.saveBatch(batch);
      totalProcessed += batch.length;
    }

    this.logger.log(`Import completed. Total records: ${totalProcessed}`);

    // Update statistics
    await this.updateMaterializedViews();
  }

  async importFromJSONL(filePath: string): Promise<void> {
    this.logger.log(`Starting JSONL import from ${filePath}`);
    let batch: Partial<Person>[] = [];
    let totalProcessed = 0;

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const record = JSON.parse(line);
        batch.push(this.mapRowToPerson(record));

        if (batch.length >= this.BATCH_SIZE) {
          await this.saveBatch(batch);
          totalProcessed += batch.length;
          this.logger.log(`Processed ${totalProcessed} records`);
          batch = [];
        }
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`Error parsing line: ${error.message}`);
        } else {
          this.logger.error('An unexpected error occurred during parsing');
        }
      }
    }

    if (batch.length > 0) {
      await this.saveBatch(batch);
      totalProcessed += batch.length;
    }

    this.logger.log(`Import completed. Total records: ${totalProcessed}`);

    // Update statistics
    await this.updateMaterializedViews();
  }

  private mapRowToPerson(row: any): Partial<Person> {
    return {
      firstname: row.firstname || row.Firstname || null,
      lastname: row.lastname || row.Lastname || null,
      middlename: row.middlename || row.Middlename || null,
      name_suff: row.name_suff || row.Name_suff || null,
      dob: row.dob || row.Dob || null,
      address: row.address || row.Address || null,
      city: row.city || row.City || null,
      county_name: row.county_name || row.County_name || null,
      st: row.st || row.St || row.state || null,
      zip: row.zip || row.Zip || null,
      ssn: row.ssn || row.SSN || null,
      phone1: row.phone1 || row.Phone1 || null,
    };
  }

  private async saveBatch(batch: Partial<Person>[]): Promise<void> {
    try {
      await this.personRepository
        .createQueryBuilder()
        .insert()
        .into(Person)
        .values(batch)
        .execute();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error parsing line: ${error.message}`);
      }
      throw error;
    }
  }

  private async updateMaterializedViews(): Promise<void> {
    try {
      await this.personRepository.query(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY state_stats',
      );
      this.logger.log('Materialized views updated');
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error parsing line: ${error.message}`);
      }
    }
  }

  async getImportStats(): Promise<any> {
    const total = await this.personRepository.count();

    const stateStats = await this.personRepository.query(
      'SELECT * FROM state_stats ORDER BY record_count DESC',
    );

    const recentRecords = await this.personRepository
      .createQueryBuilder('p')
      .select('COUNT(*)', 'count')
      .where('p.id > (SELECT MAX(id) - 10000 FROM people)')
      .getRawOne();

    return {
      totalRecords: total,
      stateStatistics: stateStats,
      recentImport: recentRecords.count,
    };
  }

  async bulkInsertFromArray(records: Partial<Person>[]): Promise<void> {
    const batchSize = this.BATCH_SIZE;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await this.saveBatch(batch);
      this.logger.log(
        `Inserted batch ${i / batchSize + 1} of ${Math.ceil(records.length / batchSize)}`,
      );
    }
  }
}
