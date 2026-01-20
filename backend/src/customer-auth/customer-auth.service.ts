import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const CUSTOMER_TOKEN_EXPIRY = '7d';

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: CustomerRegisterDto) {
    const { email, password, name, phone, preferredLanguage } = registerDto;

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await this.prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        preferredLanguage: preferredLanguage || 'en',
      },
    });

    const payload = { sub: customer.id, email: customer.email, type: 'customer' };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: CUSTOMER_TOKEN_EXPIRY,
    });

    return {
      access_token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        preferredLanguage: customer.preferredLanguage,
      },
    };
  }

  async login(loginDto: CustomerLoginDto) {
    const { email, password } = loginDto;

    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (customer.lockedUntil && customer.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (customer.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${remainingMinutes} minute(s).`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      const newFailedAttempts = customer.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: newFailedAttempts };

      if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
      }

      await this.prisma.customer.update({
        where: { id: customer.id },
        data: updateData,
      });

      if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
        throw new UnauthorizedException(
          `Account locked due to too many failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException(
        'Account has been deactivated. Please contact support.',
      );
    }

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const payload = { sub: customer.id, email: customer.email, type: 'customer' };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: CUSTOMER_TOKEN_EXPIRY,
    });

    return {
      access_token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        preferredLanguage: customer.preferredLanguage,
      },
    };
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    return customer;
  }

  async updateProfile(customerId: string, updateDto: UpdateProfileDto) {
    // Trim whitespace from name if provided
    const sanitizedData: any = {};

    if (updateDto.name !== undefined) {
      sanitizedData.name = updateDto.name.trim();
    }

    if (updateDto.phone !== undefined) {
      sanitizedData.phone = updateDto.phone;
    }

    if (updateDto.preferredLanguage !== undefined) {
      sanitizedData.preferredLanguage = updateDto.preferredLanguage;
    }

    try {
      const customer = await this.prisma.customer.update({
        where: { id: customerId },
        data: sanitizedData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          preferredLanguage: true,
        },
      });

      return customer;
    } catch (error) {
      throw new BadRequestException('Failed to update profile');
    }
  }

  async changePassword(customerId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getOrderHistory(customerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId },
        include: {
          table: {
            select: { tableNumber: true },
          },
          items: {
            include: {
              selectedModifiers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: { customerId },
      }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async validateCustomer(customerId: string) {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        preferredLanguage: true,
      },
    });
  }

  async checkEmailAvailability(email: string) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email },
    });
    return { available: !existingCustomer };
  }
}
