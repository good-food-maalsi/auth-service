import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() { email, password }: LoginDto, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(email, password);

      const accessToken = await this.authService.generateAccessToken(
        user.id,
        user.userRoles,
        {
          franchiseId: user.franchiseId ?? undefined,
          username: user.username,
          email: user.email,
        },
      );
      const refreshToken = await this.authService.generateRefreshToken(user.id);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000, // 5 minutes
        sameSite: 'strict',
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      const roles =
        user.userRoles?.map((ur) => ur.role?.role).filter(Boolean) || [];
      return res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    const accessToken = (authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null) ?? req.cookies?.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Access token not found');
    }
    const payload = await this.authService.verifyToken(accessToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.authService.getUserById(payload.sub);
    const roles =
      user.userRoles?.map((ur) => ur.role?.role).filter(Boolean) || [];
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: roles[0] ?? null,
      roles,
    };
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });

    return res.json({ message: 'Logged out successfully' });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logoutPost(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });

    return res.json({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;

      if (!refreshToken) {
        throw new ForbiddenException('token not found');
      }

      const payload = await this.authService.verifyToken(refreshToken);

      if (!payload) {
        throw new UnauthorizedException('token is not valid');
      }

      // Re-fetch user from database to get current franchiseId and roles
      const user = await this.authService.getUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newAccessToken = await this.authService.generateAccessToken(
        user.id,
        user.userRoles,
        {
          franchiseId: user.franchiseId ?? undefined,
          username: user.username,
          email: user.email,
        },
      );
      const newRefreshToken = await this.authService.generateRefreshToken(
        user.id,
      );

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000, // 5 minutes
        sameSite: 'strict',
      });
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      return res.json({
        message: 'Tokens refreshed',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      throw error;
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() data: RegisterDto,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.register(data);
      const fullUser = await this.authService.getUserById(user.id);

      const magicToken = await this.authService.generateMagicToken(
        user.email,
        user.username,
      );
      const pub = await this.rabbitMQService.sendMessage(
        JSON.stringify({
          username: user.username,
          email: user.email,
          magicToken,
        }),
      );
      const welcomePub = await this.rabbitMQService.sendMessage(
        JSON.stringify({
          userId: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        }),
        'WelcomeUserQueue',
      );

      if (!pub) {
        console.warn(
          'Register: user created but email not queued (RabbitMQ unavailable)',
        );
      }
      if (!welcomePub) {
        console.warn(
          'Register: user created but welcome workflow not queued (RabbitMQ unavailable)',
        );
      }

      const roles =
        fullUser.userRoles?.map((ur) => ur.role?.role).filter(Boolean) || [];
      const accessToken = await this.authService.generateAccessToken(
        fullUser.id,
        fullUser.userRoles ?? [],
        {
          franchiseId: fullUser.franchiseId ?? undefined,
          username: fullUser.username,
          email: fullUser.email,
        },
      );
      const refreshToken =
        await this.authService.generateRefreshToken(fullUser.id);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000,
        sameSite: 'strict',
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      });

      return res.status(HttpStatus.CREATED).json({
        message:
          'User registered successfully, confirm your email before logging',
        accessToken,
        refreshToken,
        user: {
          id: fullUser.id,
          email: fullUser.email,
          username: fullUser.username,
          roles,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  @Get('verify')
  async verifyMagicToken(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      const payload = await this.authService.verifyToken(token);
      return { success: true, email: payload.email };
    } catch (error) {
      throw error;
    }
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(@Req() req: Request, @Res() res: Response) {
    try {
      const accessToken = req.cookies?.accessToken;
      const userPayload = await this.authService.verifyToken(accessToken);

      await this.authService.unsubscribe(userPayload.sub);

      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
      });

      return res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
      throw error;
    }
  }
}
