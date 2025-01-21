import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() { email, password }: LoginDto, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(email, password);
      console.log('🚀 ~ AuthController ~ login ~ user:', user);

      const accessToken = await this.authService.generateAccessToken(
        user.id,
        user.userRoles,
      );
      const refreshToken = await this.authService.generateRefreshToken(user.id);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      path: '/',
    });

    return res.json({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const accessToken = req.cookies?.accessToken;

      if (!refreshToken) {
        return new ForbiddenException('Refresh token not found');
      }

      const user = await this.authService.verifyToken(refreshToken);

      if (!user) {
        throw new UnauthorizedException('token is not valid');
      }

      const accessTokenPayload =
        await this.authService.decodeToken(accessToken);
      console.log(
        '🚀 ~ AuthController ~ refreshTokens ~ accessTokenPayload:',
        accessTokenPayload,
      );

      const newAccessToken = await this.authService.generateAccessToken(
        accessTokenPayload.sub,
        accessTokenPayload.role,
      );
      const newRefreshToken = await this.authService.generateRefreshToken(
        user.id,
      );

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
      return {
        message: 'User registered successfully',
        user,
      };
    } catch (error) {
      throw error;
    }
  }
}
