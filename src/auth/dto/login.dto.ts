import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: 'The email of the user',
    required: true,
    example: 'johndoe@example.com',
  })
  email: string;

  @IsString()
  @ApiProperty({
    description: 'The password of the user',
    required: true,
    example: 'azertyuiop',
  })
  password: string;
}
