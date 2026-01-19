import { IsEmail, IsString, IsOptional } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}
