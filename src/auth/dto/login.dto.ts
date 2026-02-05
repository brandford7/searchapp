// src/auth/dto/login.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class TemporaryLoginDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class GenerateTemporaryAccessDto {
  @IsString()
  @IsNotEmpty()
  username!: string; // Can be email or identifier

  @IsNotEmpty()
  expiresInHours!: number; // How long the token is valid
}
