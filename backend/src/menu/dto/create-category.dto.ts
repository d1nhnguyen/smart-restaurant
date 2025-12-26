import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { MenuStatus } from '@prisma/client';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsEnum(MenuStatus)
  status?: MenuStatus;
}