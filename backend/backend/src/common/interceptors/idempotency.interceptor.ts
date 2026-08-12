import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CachedResponse {
  body: unknown;
  status: number;
  expiresAt: number;
}

/**
 * Honors the `Idempotency-Key` header on mutating endpoints (§7). Stage 1:
 * process-local Map. Stage 4: swap `store` for a Redis-backed one so retries
 * are safe across multiple backend replicas — the interceptor contract
 * (get/set by key) doesn't change, only where it's stored.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private static store = new Map<string, CachedResponse>();
  private static TTL_MS = 24 * 60 * 60 * 1000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const method = req.method as string;

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const key = req.headers['idempotency-key'] as string | undefined;
    if (!key) return next.handle();

    const cacheKey = `${req.user?.id ?? 'anon'}:${req.method}:${req.originalUrl}:${key}`;
    const cached = IdempotencyInterceptor.store.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.status(cached.status);
      return of(cached.body);
    }

    return next.handle().pipe(
      tap((body) => {
        IdempotencyInterceptor.store.set(cacheKey, {
          body,
          status: res.statusCode ?? 200,
          expiresAt: Date.now() + IdempotencyInterceptor.TTL_MS,
        });
      }),
    );
  }
}
