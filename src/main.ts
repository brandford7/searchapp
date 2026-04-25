import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeedService } from './auth/seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://usersearchapp-org.vercel.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Add cache headers for read-only responses
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Content-Type-Options': 'nosniff',
    });
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('People Search API - Read Only')
    .setDescription(
      'Fast search using full-text search vectors. Returns firstname, lastname, ssn only.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Seed admin user on startup
  const seedService = app.get(SeedService);
  await seedService.seedAdminUser();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application running on: http://localhost:${port}/api`);
}
bootstrap();
