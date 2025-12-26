import { IsEnum, IsNotEmpty } from 'class-validator';
import { MenuStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(MenuStatus)
  status: MenuStatus;
}