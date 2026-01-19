import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { IsStrongPassword } from '../../auth/validators/password.validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(UserRole, {
    message: 'Role must be either ADMIN, STAFF or WAITER.',
  })
  role: UserRole;
}
