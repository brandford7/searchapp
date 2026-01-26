import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
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

  await app.listen(3000);
  console.log('People Search API running on http://localhost:3000');
  console.log('API Docs: http://localhost:3000/api');
}
bootstrap();
