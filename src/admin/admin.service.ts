import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as argon2 from 'argon2';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../admin/dto/create-user.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  async createUser(data: CreateUserDto) {
    try {
      const { email, password, username, role } = data;
      await this.authService.checkEmailAvailabilityOrDie(email);

      const hashedPassword = await argon2.hash(password);

      const user = await this.databaseService.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          userRoles: {
            create: {
              role: {
                connect: { role },
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
}
