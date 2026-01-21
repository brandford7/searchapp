import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { typeOrmConfig } from './database.config';
import { ConfigModule } from '@nestjs/config';
import { dataSourceOptions } from './database.config';

@Module({
  imports: [
    // config module
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions,
    }),
  ],
})
export class DatabaseModule {}
