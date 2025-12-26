import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemStatus } from '@prisma/client';

export enum ItemSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  STATUS_ASC = 'status_asc',
  STATUS_DESC = 'status_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
}

export class GetItemsFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsEnum(ItemSort)
  sort?: ItemSort;
}