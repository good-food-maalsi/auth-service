import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  validateSync,
  IsIn,
  MinLength,
} from 'class-validator';

class EnvironementVariables {
  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  @IsNotEmpty()
  @IsString()
  POSTGRES_USER: string;

  @IsNotEmpty()
  @IsString()
  POSTGRES_PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  POSTGRES_DB: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test';

  @IsNotEmpty()
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsNotEmpty()
  @IsNumber()
  APP_PORT: number;

  @IsNotEmpty()
  @IsString()
  ADMIN_EMAIL: string;

  @IsNotEmpty()
  @IsString()
  ADMIN_PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  ADMIN_USERNAME: string;
}

export function validate(config: Record<string, unknown>) {
  const validateConfig = plainToInstance(EnvironementVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validateConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validateConfig;
}
