import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global prefix
  app.setGlobalPrefix('api');

  const port = 3000;
  await app.listen(port);

  logger.log(`🚀 App running: http://localhost:${port}/api`);
  logger.log(`💚 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
