import { IsString, IsEmail } from 'class-validator';
import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto implements Prisma.UserCreateInput {
  @IsString()
  @ApiProperty({
    description: 'The username of the user',
    required: true,
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'The email of the user',
    required: true,
    example: 'johndoe@example.com',
  })
  @IsEmail()
  email: string;

  @IsString()
  @ApiProperty({
    description: 'The password of the user',
    required: true,
    example: 'azertyuiop',
  })
  @IsString()
  password: string;
}
