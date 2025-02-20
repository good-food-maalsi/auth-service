import { Response, Request } from 'express';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  constructor(private configService: ConfigService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    this.logger.error(`Exception: ${exception.message}, status: ${status}`);

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    response.status(status).json(
      isProduction
        ? {
            statusCode: status,
            timestamp: new Date().toISOString(),
            message,
            path: request.url,
          }
        : {
            statusCode: status,
            timestamp: new Date().toISOString(),
            message,
            path: request.url,
            stacktrace: exception.stack,
          },
    );
  }
}
