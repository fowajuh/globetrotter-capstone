import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws'; 
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

/**
 * Stage 1 entrypoint. Every module below (auth/users/trips/itinerary/
 * recommendations/budget/notifications) owns its own DTOs and service
 * layer and never reaches into another module's repository directly —
 * that boundary is what makes the Stage 2 microservice split a copy/paste
 * of a folder instead of a rewrite.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Chat voice notes/images/files ride as base64 data URLs in the JSON body
  // (see message.dto.ts) — there's no object storage in Stage 1 — so the
  // default 100kb express limit has to grow to fit them.
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));
  app.useWebSocketAdapter(new WsAdapter(app));
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new IdempotencyInterceptor());
  await app.listen(process.env.PORT ?? 4000);
  // eslint-disable-next-line no-console
  console.log(`GlobeTrotter API on :${process.env.PORT ?? 4000}`);
}
bootstrap();
