import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { UserRoles } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(
    userId: string,
    role: UserRoles[],
    franchiseId?: string,
  ) {
    try {
      const payload = {
        sub: userId,
        role,
        ...(franchiseId && { franchiseId }),
      };
      const token = this.jwtService.sign(payload, { expiresIn: '5m' });
      return token;
    } catch (error) {
      throw error;
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    try {
      const payload = { sub: userId };
      const token = this.jwtService.sign(payload, { expiresIn: '7d' });

      return token;
    } catch (error) {
      throw error;
    }
  }

  async generateMagicToken(email: string, username: string): Promise<string> {
    const payload = { email, username };
    const magicToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    return magicToken;
  }

  /**
   * Validate user refresh token
   * @param jwtToken
   * @returns user data on success or error
   */
  async verifyToken(jwtToken: string) {
    try {
      const secret = this.configService.get<string>('JWT_PUBLIC_KEY_BASE64');
      const payload = this.jwtService.verify(jwtToken, {
        secret,
      });
      return payload;
    } catch (error) {
      throw error;
    }
  }

  async decodeToken(token: string | undefined): Promise<any> {
    try {
      if (!token) {
        throw new BadRequestException('Refresh token is missing');
      }
      const payload = this.jwtService.decode(token);
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }
      return payload;
    } catch (error) {
      throw error;
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (await argon2.verify(user.password, password)) {
        return user;
      } else {
        throw new UnauthorizedException('Invalid credentials');
      }
    } catch (error) {
      throw error;
    }
  }

  async checkEmailAvailabilityOrDie(email: string) {
    try {
      const existingUser = await this.databaseService.user.findUnique({
        where: { email },
        include: {
          userRoles: true,
        },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    } catch (error) {
      throw error;
    }
  }

  async register(data: RegisterDto) {
    try {
      const { email, password, username } = data;
      await this.checkEmailAvailabilityOrDie(email);

      const hashedPassword = await argon2.hash(password);

      const user = await this.databaseService.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          userRoles: {
            create: {
              role: {
                connect: { role: 'CUSTOMER' },
              },
            },
          },
        },
      });

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      };

      return userData;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async unsubscribe(id: string) {
    try {
      await this.databaseService.user.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
