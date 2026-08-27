import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Headers via Helmet (HSTS, Clickjacking Prevention, NoSniff)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://*.supabase.co', 'http://localhost:9000'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Cookie Parser Middleware for HttpOnly cookies
  app.use(cookieParser());

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Explicit CORS configuration (L-05 Hardened: No blanket wildcard origin matching in production)
  const isProd = process.env.NODE_ENV === 'production';
  const rawAllowed = [
    process.env.APP_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(isProd ? [] : ['http://localhost:3000', 'http://localhost:4000', 'http://127.0.0.1:3000']),
  ]
    .filter(Boolean)
    .map((o) => o!.trim().replace(/\/+$/, ''));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      if (rawAllowed.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Allow localhost in development environment only
      if (!isProd && (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Cookie, X-Requested-With',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('AnveshakHub Enterprise REST API')
    .setDescription('Master Build Blueprint v3.0 REST API Specification with Security Hardening')
    .setVersion('3.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 AnveshakHub Enterprise API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 OpenAPI / Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
