import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Role } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.accessToken;
          if (!token) {
            throw new UnauthorizedException(
              'Access token not found in cookies',
            );
          }
          return token;
        },
      ]),
      secretOrKey: process.env.JWT_PUBLIC_KEY_BASE64,
    });
  }

  async validate(payload: { sub: string; role: Role[]; franchiseId?: string }) {
    return {
      userId: payload.sub,
      roles: payload.role,
      franchiseId: payload.franchiseId || null,
    };
  }
}
