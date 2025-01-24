import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthMiddleware } from './auth.middleware';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        publicKey: configService.get<string>('JWT_PUBLIC_KEY_BASE64'),
        privateKey: configService.get<string>('JWT_PRIVATE_KEY_BASE64'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '5m',
        },
      }),
    }),
    RabbitmqModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthMiddleware],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
