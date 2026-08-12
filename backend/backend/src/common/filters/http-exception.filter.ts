import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * One JSON error shape for every failure mode, so the frontend's error
 * states (§3, "every screen ships with an error state") never have to
 * special-case a raw stack trace or a bare NestJS default body.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : null;

    const message =
      typeof body === 'string'
        ? body
        : (body as { message?: string | string[] })?.message ?? 'Something went wrong on our end.';

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} -> ${status}`, (exception as Error)?.stack);
    }

    res.status(status).json({
      error: {
        status,
        message: Array.isArray(message) ? message[0] : message,
        details: Array.isArray(message) ? message : undefined,
        path: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
