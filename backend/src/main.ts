import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // ─── Security ───────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc:    ["'self'", 'fonts.gstatic.com'],
        imgSrc:     ["'self'", 'data:', 'https:'],
        scriptSrc:  ["'self'"],
      },
    } : false,
  }));
  app.use(compression());

  // ─── CORS ───────────────────────────────────────────────────
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.enableCors({
    origin: isProduction
      ? [frontendUrl, `https://www.${frontendUrl?.replace('https://', '')}`]
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ─── Global validation ──────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: isProduction, // Hide field details in production
    }),
  );

  // ─── API prefix ─────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Swagger (always available — protect with Nginx if needed) ──
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CA Portal API')
    .setDescription('CA firm practice management API — v1')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`https://${configService.get('DOMAIN', 'localhost')}`)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // ─── Graceful shutdown ──────────────────────────────────────
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 CA Portal API running on port ${port}`);
  logger.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
