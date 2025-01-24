import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './global-filters/http-exception.filter';
import createAdmin from './scripts/create-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT');
  app.use(cookieParser());
  app.enableCors({
    origin: [`http://localhost:${port}`],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // delete unespected properties
      forbidNonWhitelisted: true, // throw error for unespected properties
      transform: true, // transform payloads to DTO objects
      disableErrorMessages: false,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(configService));
  await createAdmin();
  await app.listen(port);
}
bootstrap();
