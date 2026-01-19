import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class VNPayService {
    private vnpayUrl: string;
    private tmnCode: string;
    private hashSecret: string;
    private returnUrl: string;
    private usdToVndRate: number;

    constructor(private configService: ConfigService) {
        this.vnpayUrl = this.configService.get<string>('VNPAY_URL');
        this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
        this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
        this.returnUrl = this.configService.get<string>('VNPAY_RETURN_URL');
        this.usdToVndRate = this.configService.get<number>('USD_TO_VND_RATE') || 25000;
    }

    /**
     * Create VNPay payment URL
     * @param orderId - Order ID
     * @param amountUSD - Amount in USD
     * @param orderInfo - Order description
     * @param ipAddress - Client IP address
     * @param bankCode - Optional bank code
     * @param language - Language (vn or en)
     */
    createPaymentUrl(
        orderId: string,
        amountUSD: number,
        orderInfo: string,
        ipAddress: string,
        bankCode?: string,
        language: string = 'vn',
    ): string {
        // Convert USD to VND and round to nearest 100
        const amountVND = Math.round((amountUSD * this.usdToVndRate) / 100) * 100;

        const date = new Date();
        const createDate = this.formatDate(date);
        const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

        let vnpParams: any = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Amount: amountVND * 100, // VNPay requires amount * 100
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Locale: language || 'vn', // Must be 'vn' or 'en'
            vnp_ReturnUrl: this.returnUrl,
            vnp_IpAddr: ipAddress,
            vnp_CreateDate: createDate,
        };

        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode;
        }

        // Sort params and create signature
        vnpParams = this.sortObject(vnpParams);

        // Create signature data - must be in query string format
        // Format: key1=value1&key2=value2 (values must NOT be URL encoded for signature)
        const signData = Object.keys(vnpParams)
            .map(key => {
                const value = encodeURIComponent(vnpParams[key]).replace(/%20/g, '+');
                return `${key}=${value}`;
            })
            .join('&');

        const hmac = crypto.createHmac('sha512', this.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnpParams.vnp_SecureHash = signed;

        // Build payment URL
        const paymentUrl = this.vnpayUrl + '?' + signData + '&vnp_SecureHash=' + signed;

        return paymentUrl;
    }

    /**
     * Verify return URL from VNPay using RAW query string
     * This preserves original VNPay encoding
     */
    verifyReturnUrlRaw(rawQueryString: string, parsedParams: any): {
        success: boolean;
        code: string;
        message: string;
        data?: any;
    } {
        const secureHash = parsedParams.vnp_SecureHash;

        // Remove vnp_SecureHash and vnp_SecureHashType from raw string
        let signData = rawQueryString
            .split('&')
            .filter(pair => !pair.startsWith('vnp_SecureHash') && !pair.startsWith('vnp_SecureHashType'))
            .sort() // Sort alphabetically as VNPay requires
            .join('&');

        const hmac = crypto.createHmac('sha512', this.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // Signature verified

        if (secureHash !== signed) {
            return {
                success: false,
                code: '97',
                message: 'Invalid signature',
            };
        }

        const responseCode = parsedParams.vnp_ResponseCode;
        const transactionStatus = parsedParams.vnp_TransactionStatus;

        // Convert amount back to USD
        const amountVND = parseInt(parsedParams.vnp_Amount) / 100;
        const amountUSD = amountVND / this.usdToVndRate;

        if (responseCode === '00' && transactionStatus === '00') {
            return {
                success: true,
                code: '00',
                message: 'Payment successful',
                data: {
                    orderId: parsedParams.vnp_TxnRef,
                    amount: amountUSD,
                    amountVND: amountVND,
                    transactionNo: parsedParams.vnp_TransactionNo,
                    bankCode: parsedParams.vnp_BankCode,
                    bankTranNo: parsedParams.vnp_BankTranNo,
                    cardType: parsedParams.vnp_CardType,
                    payDate: parsedParams.vnp_PayDate,
                    responseCode: responseCode,
                },
            };
        } else {
            return {
                success: false,
                code: responseCode,
                message: this.getResponseMessage(responseCode),
                data: {
                    orderId: parsedParams.vnp_TxnRef,
                },
            };
        }
    }

    /**
     * Verify return URL from VNPay
     * @param query - Query parameters from VNPay
     */
    verifyReturnUrl(query: any): {
        success: boolean;
        code: string;
        message: string;
        data?: any;
    } {
        const vnpParams = { ...query };
        const secureHash = vnpParams.vnp_SecureHash;

        // Processing VNPay callback

        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;

        const sortedParams = this.sortObject(vnpParams);

        // Use querystring.stringify - it encodes exactly like VNPay expects
        const signData = querystring.stringify(sortedParams);

        const hmac = crypto.createHmac('sha512', this.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // Signature verified

        if (secureHash !== signed) {
            return {
                success: false,
                code: '97',
                message: 'Invalid signature',
            };
        }

        const responseCode = vnpParams.vnp_ResponseCode;
        const transactionStatus = vnpParams.vnp_TransactionStatus;

        // Convert amount back to USD (amount is in VND * 100)
        const amountVND = parseInt(vnpParams.vnp_Amount) / 100;
        const amountUSD = amountVND / this.usdToVndRate;

        if (responseCode === '00' && transactionStatus === '00') {
            return {
                success: true,
                code: '00',
                message: 'Payment successful',
                data: {
                    orderId: vnpParams.vnp_TxnRef,
                    amount: amountUSD,
                    amountVND: amountVND,
                    transactionNo: vnpParams.vnp_TransactionNo,
                    bankCode: vnpParams.vnp_BankCode,
                    bankTranNo: vnpParams.vnp_BankTranNo,
                    cardType: vnpParams.vnp_CardType,
                    payDate: vnpParams.vnp_PayDate,
                    responseCode: responseCode,
                },
            };
        } else {
            return {
                success: false,
                code: responseCode,
                message: this.getResponseMessage(responseCode),
                data: {
                    orderId: vnpParams.vnp_TxnRef,
                },
            };
        }
    }

    /**
     * Verify IPN (Instant Payment Notification) from VNPay
     * @param query - Query parameters from VNPay IPN
     */
    verifyIpnUrl(query: any): {
        isValid: boolean;
        orderId: string;
        amount: number;
        responseCode: string;
        message?: string;
    } {
        const vnpParams = { ...query };
        const secureHash = vnpParams.vnp_SecureHash;

        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;

        const sortedParams = this.sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams);
        const hmac = crypto.createHmac('sha512', this.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const amountVND = parseInt(vnpParams.vnp_Amount) / 100;
        const amountUSD = amountVND / this.usdToVndRate;

        return {
            isValid: secureHash === signed,
            orderId: vnpParams.vnp_TxnRef,
            amount: amountUSD,
            responseCode: vnpParams.vnp_ResponseCode,
            message: secureHash !== signed ? 'Invalid signature' : undefined,
        };
    }

    /**
     * Sort object by key
     */
    private sortObject(obj: any): any {
        const sorted: any = {};
        const keys = Object.keys(obj).sort();
        keys.forEach((key) => {
            sorted[key] = obj[key];
        });
        return sorted;
    }

    /**
     * Format date to YYYYMMDDHHmmss
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Get response message from VNPay response code
     */
    private getResponseMessage(code: string): string {
        const messages: { [key: string]: string } = {
            '00': 'Transaction successful',
            '07': 'Transaction successful. Suspicious transaction (related to fraud, unusual transaction)',
            '09': 'Customer has not registered for Internet Banking at bank',
            '10': 'Customer entered incorrect card/account information more than 3 times',
            '11': 'Payment deadline has expired. Please try again',
            '12': 'Card/Account is locked',
            '13': 'Incorrect transaction authentication password (OTP)',
            '24': 'Customer canceled transaction',
            '51': 'Account does not have enough balance',
            '65': 'Account has exceeded daily transaction limit',
            '75': 'Payment bank is under maintenance',
            '79': 'Payment amount exceeds limit',
            '99': 'Unknown error',
        };
        return messages[code] || 'Unknown error';
    }
}
