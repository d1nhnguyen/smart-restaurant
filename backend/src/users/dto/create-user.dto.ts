import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { IsStrongPassword } from '../../auth/validators/password.validator';

export enum UserRole {
  STAFF = 'STAFF',
  WAITER = 'WAITER',
}

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
    message:
      'Role must be either STAFF or WAITER. Admin accounts cannot be created through this API.',
  })
  role: UserRole;
}
