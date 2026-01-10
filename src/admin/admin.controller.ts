import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from '../admin/dto/create-user.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { FranchiseOwnerGuard } from '../auth/guards/franchise-owner.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(Role.ADMIN, Role.FRANCHISE_OWNER)
  @UseGuards(FranchiseOwnerGuard)
  @Post('create-user')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.adminService.createUser(createUserDto);
      return {
        message: 'User created successfully',
        user,
      };
    } catch (error) {
      throw error;
    }
  }

  @Roles(Role.ADMIN, Role.FRANCHISE_OWNER)
  @Get('users/franchise/:franchiseId')
  async getUsersByFranchise(
    @Param('franchiseId') franchiseId: string,
    @GetUser() user: any,
  ) {
    const isAdmin = user.roles.some((r) => r.role.role === Role.ADMIN);

    // If not ADMIN, check that it's his franchise
    if (!isAdmin && user.franchiseId !== franchiseId) {
      throw new ForbiddenException(
        'You can only view users in your own franchise',
      );
    }

    return this.adminService.getUsersByFranchise(franchiseId);
  }
}
