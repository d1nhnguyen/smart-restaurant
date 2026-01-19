import { IsEmail, IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { IsStrongPassword } from '../../auth/validators/password.validator';

export enum UserRole {
  STAFF = 'STAFF',
  WAITER = 'WAITER',
}

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
    message:
      'Role must be either STAFF or WAITER. Admin accounts cannot be created through this API.',
  })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
