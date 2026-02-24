import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Access and refresh tokens are missing');
    }

    const payload = this.jwtService.verify(accessToken, {
      secret: this.configService.get<string>('JWT_PUBLIC_KEY_BASE64'),
    });
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }
    req.user = payload;
    return next();
  }
}
