import { PartialType } from '@nestjs/mapped-types';
import { CreateModifierOptionDto } from './create-modifier-option.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { MenuStatus } from '@prisma/client';

export class UpdateModifierOptionDto extends PartialType(CreateModifierOptionDto) {
  @IsEnum(MenuStatus)
  @IsOptional()
  status?: MenuStatus;
}
