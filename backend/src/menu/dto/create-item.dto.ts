import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { ItemStatus } from '@prisma/client';

export class CreateMenuItemDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 80)
  name: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  prepTimeMinutes?: number;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsBoolean()
  isChefRecommended?: boolean;
}