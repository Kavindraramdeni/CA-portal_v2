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
  const frontendUrl = configService.get<string>('FRONTEND_URL');

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

  // ─── CORS (FIXED) ──────────────────────────────────────────────────
  // ✅ Allow Vercel preview URLs, production URLs, and localhost
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without origin (mobile apps, same-origin requests)
      if (!origin) {
        return callback(null, true);
      }

      // Whitelist patterns
      const allowedPatterns = [
        /localhost:\d+$/,                          // localhost:3000, :5173, etc
        /127\.0\.0\.1:\d+$/,                       // 127.0.0.1
        /\.vercel\.app$/,                          // All Vercel deployments
        new RegExp(`^${frontendUrl?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), // Exact match for FRONTEND_URL
      ];

      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));

      if (isAllowed) {
        callback(null, true);
      } else {
        if (!isProduction) {
          // In dev, be lenient
          callback(null, true);
        } else {
          callback(new Error(`CORS not allowed for origin: ${origin}`));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 3600,
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
  logger.log(`✅ CORS enabled for: ${frontendUrl}`);
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
