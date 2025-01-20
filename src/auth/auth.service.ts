import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { UserRoles } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(userId: string, role: UserRoles[]) {
    try {
      const payload = { sub: userId, role };
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

  /**
   * Validate user refresh token
   * @param jwtToken
   * @returns user data on success or error
   */
  async verifyToken(jwtToken: string) {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(jwtToken, {
        secret,
      });
      console.log('🚀 ~ AuthService ~ verifyToken ~ payload:', payload);
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
              role: true,
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

  async register(data: RegisterDto) {
    try {
      const { email, password, username } = data;
      const existingUser = await this.databaseService.user.findUnique({
        where: { email },
        include: {
          userRoles: true,
        },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Hacher le mot de passe
      const hashedPassword = await argon2.hash(password);

      // Créer le nouvel utilisateur
      const user = await this.databaseService.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
        },
      });

      const customerRole = await this.databaseService.roles.findUnique({
        where: { role: Role.CUSTOMER },
      });

      if (!customerRole) {
        throw new NotFoundException('Role CUSTOMER not found');
      }

      await this.databaseService.userRoles.create({
        data: {
          userId: user.id,
          roleId: customerRole.id,
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
}
