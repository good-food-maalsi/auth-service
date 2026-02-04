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
  ServiceUnavailableException,
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
        user.franchiseId, // Ajouter franchiseId
      );
      const refreshToken = await this.authService.generateRefreshToken(user.id);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
        sameSite: 'strict',
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      return res.json({ message: 'Login successful' });
    } catch (error) {
      throw error;
    }
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'strict',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'strict',
    });

    return res.json({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const accessToken = req.cookies?.accessToken;

      if (!refreshToken || !accessToken) {
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
        user.franchiseId, // Use current franchiseId from DB
      );
      const newRefreshToken = await this.authService.generateRefreshToken(
        user.id,
      );

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
        sameSite: 'strict',
      });
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      return res.json({ message: 'Tokens refreshed' });
    } catch (error) {
      throw error;
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body()
    data: RegisterDto,
  ) {
    try {
      const user = await this.authService.register(data);
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

      if (!pub) {
        throw new ServiceUnavailableException(
          'Unable to send message to RabbitMQ. Please try again later.',
        );
      }

      return {
        message:
          'User registered successfully, confirm your email before logging',
        user,
      };
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
        secure: true,
        path: '/',
        sameSite: 'strict',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'strict',
      });

      return res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
      throw error;
    }
  }
}
