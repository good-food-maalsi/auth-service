import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as argon2 from 'argon2';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../admin/dto/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  async createUser(data: CreateUserDto) {
    try {
      const { email, password, username, role, franchiseId } = data;
      await this.authService.checkEmailAvailabilityOrDie(email);

      // BUSINESS RULE : franchiseId is required for STAFF and FRANCHISE_OWNER roles
      if (!franchiseId) {
        throw new BadRequestException(
          'Franchise ID is required for STAFF and FRANCHISE_OWNER roles',
        );
      }

      // BUSINESS RULE : validate that the role is STAFF or FRANCHISE_OWNER (already validated by DTO)
      if (role !== Role.STAFF && role !== Role.FRANCHISE_OWNER) {
        throw new BadRequestException('Invalid role for admin-created users');
      }

      const hashedPassword = await argon2.hash(password);

      const user = await this.databaseService.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          franchiseId, // Set franchiseId (required for these roles)
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
        franchiseId: user.franchiseId,
        createdAt: user.createdAt,
      };

      return userData;
    } catch (error) {
      throw error;
    }
  }

  async getUsersByFranchise(franchiseId: string) {
    const users = await this.databaseService.user.findMany({
      where: { franchiseId },
      include: {
        userRoles: {
          include: {
            role: { select: { role: true } },
          },
        },
      },
    });

    // Return users without password field
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      franchiseId: user.franchiseId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      userRoles: user.userRoles,
    }));
  }
}
