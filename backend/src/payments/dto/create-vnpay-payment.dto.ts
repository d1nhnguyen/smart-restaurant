import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateVNPayPaymentDto {
    @IsString()
    orderId: string;

    @IsNumber()
    amount: number; // Amount in USD

    @IsString()
    orderInfo: string;

    @IsOptional()
    @IsString()
    bankCode?: string;

    @IsOptional()
    @IsString()
    language?: string; // vn or en
}
