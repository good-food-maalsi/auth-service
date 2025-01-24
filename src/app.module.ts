import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    RabbitmqModule,
  ],
  controllers: [AppController],
  providers: [AppService, RabbitMQService],
  exports: [RabbitMQService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('admin');
  }
}
