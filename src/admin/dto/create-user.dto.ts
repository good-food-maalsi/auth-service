import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum([Role.STAFF, Role.FRANCHISE_OWNER])
  @IsNotEmpty()
  role: TcreateUser;

  @IsString()
  @IsNotEmpty()
  franchiseId: string;
}

type TcreateUser = Exclude<Role, 'ADMIN' | 'CUSTOMER'>;
