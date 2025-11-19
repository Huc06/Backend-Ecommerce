import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  logger.log('✅ ValidationPipe registered with transform enabled');

  // Global prefix (MUST be set before Swagger setup)
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('Backend API for E-Commerce application with NestJS, PostgreSQL, JWT Auth, and VNPAY Payment')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controllers
    )
    .addTag('Auth', 'Authentication endpoints (register, login, profile)')
    .addTag('Products', 'Product management (CRUD, search, filter, pagination)')
    .addTag('Categories', 'Category management (admin only)')
    .addTag('Cart', 'Shopping cart management')
    .addTag('Orders', 'Order management and checkout')
    .addTag('Reviews', 'Product reviews and ratings')
    .addTag('Payments', 'VNPAY payment integration')
    .addTag('Uploads', 'File uploads to IPFS via Pinata')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 App running on port ${port}`);
  logger.log(`💚 Health check: http://localhost:${port}/api/health`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
