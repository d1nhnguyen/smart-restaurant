import { IsEnum, IsNumber, Min, Max, ValidateIf } from 'class-validator';

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
    NONE = 'NONE',
}

export class ApplyDiscountDto {
    @IsEnum(DiscountType)
    type: DiscountType;

    @ValidateIf((o) => o.type !== DiscountType.NONE)
    @IsNumber()
    @Min(0)
    @Max(1000) // For percentage (0-100) or reasonable max for fixed amount
    value: number;
}
