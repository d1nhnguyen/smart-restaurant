import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';

class OrderItemModifierDto {
    @IsUUID()
    @IsNotEmpty()
    modifierOptionId: string;
}

class CreateOrderItemDto {
    @IsUUID()
    @IsNotEmpty()
    menuItemId: string;

    @IsInt()
    @Min(1)
    @Max(99)
    quantity: number;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    specialRequest?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => OrderItemModifierDto)
    modifiers?: OrderItemModifierDto[];
}

export class CreateOrderDto {
    @IsUUID()
    @IsNotEmpty()
    tableId: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    notes?: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}
