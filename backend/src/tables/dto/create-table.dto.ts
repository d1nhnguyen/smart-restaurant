import { IsString, IsInt, IsOptional, Min, Max, MinLength } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @MinLength(1)
  tableNumber: string;

  @IsInt()
  @Min(1)
  @Max(20)
  capacity: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
