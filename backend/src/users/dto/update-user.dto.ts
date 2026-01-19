import { IsEmail, IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { IsStrongPassword } from '../../auth/validators/password.validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsStrongPassword()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be either ADMIN, STAFF or WAITER.',
  })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
