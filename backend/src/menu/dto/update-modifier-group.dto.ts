import { PartialType } from '@nestjs/mapped-types';
import { CreateModifierGroupDto } from './create-modifier-group.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { MenuStatus } from '@prisma/client';

export class UpdateModifierGroupDto extends PartialType(CreateModifierGroupDto) {
  @IsEnum(MenuStatus)
  @IsOptional()
  status?: MenuStatus;
}
