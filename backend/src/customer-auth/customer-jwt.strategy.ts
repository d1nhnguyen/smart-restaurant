import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomerAuthService } from './customer-auth.service';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(private customerAuthService: CustomerAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'customer') {
      throw new UnauthorizedException('Invalid token type');
    }

    const customer = await this.customerAuthService.validateCustomer(payload.sub);
    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }
    return customer;
  }
}
