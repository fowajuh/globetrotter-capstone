import { NestFactory } from '@nestjs/core';
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
  const app = await NestFactory.create(AppModule);
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
