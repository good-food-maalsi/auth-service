import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthService } from '../auth/auth.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AuthService, JwtService, RabbitMQService],
})
export class AdminModule {}
