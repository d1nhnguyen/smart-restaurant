import { IsString, IsEnum, IsBoolean, IsInt, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';
import { ModifierSelectionType } from '@prisma/client';

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ModifierSelectionType)
  selectionType: ModifierSelectionType;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxSelections?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
