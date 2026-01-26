import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PeopleModule } from './people/people.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Enable aggressive caching for read-only workload
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // 1 hour cache
      max: 1000, // Cache up to 1000 queries
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'peopleapp'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME', 'peopledb'),
        url: configService.get('DB_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
        // Optimized for read-only workload
        extra: {
          max: 20, // Connection pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        },
      }),
      inject: [ConfigService],
    }),
    PeopleModule,
  ],
})
export class AppModule {}
