import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const CUSTOMER_TOKEN_EXPIRY = '7d';
const EMAIL_VERIFY_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async register(registerDto: CustomerRegisterDto) {
    const { email, password, name, phone, preferredLanguage } = registerDto;

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerifyToken = this.generateToken();
    const emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);

    const customer = await this.prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        preferredLanguage: preferredLanguage || 'en',
        emailVerifyToken,
        emailVerifyExpires,
        isEmailVerified: false,
      },
    });

    // Send verification email
    const emailSent = await this.emailService.sendVerificationEmail(customer.email, emailVerifyToken);

    return {
      message: emailSent
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful. However, we could not send the verification email. Please request a new one.',
      requiresVerification: true,
      emailSent,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
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

    // Check if email is verified
    if (!customer.isEmailVerified) {
      throw new UnauthorizedException(
        'EMAIL_NOT_VERIFIED',
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
        isEmailVerified: customer.isEmailVerified,
      },
    };
  }

  async verifyEmail(token: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!customer) {
      // Token not found - could be already used or invalid
      // Check if there's a verified customer (token was already used)
      // For security, we don't reveal if token existed, just say invalid/expired
      return {
        message: 'Email already verified',
        alreadyVerified: true
      };
    }

    if (customer.isEmailVerified) {
      return { message: 'Email already verified', alreadyVerified: true };
    }

    if (customer.emailVerifyExpires && customer.emailVerifyExpires < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return { message: 'Email verified successfully', success: true };
  }

  async resendVerificationEmail(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const emailVerifyToken = this.generateToken();
    const emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        emailVerifyToken,
        emailVerifyExpires,
      },
    });

    // Send verification email
    const emailSent = await this.emailService.sendVerificationEmail(customer.email, emailVerifyToken);

    return {
      message: emailSent ? 'Verification email sent' : 'Failed to send verification email. Please try again.',
      emailSent,
    };
  }

  async resendVerificationByEmail(email: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!customer || customer.isEmailVerified) {
      return { message: 'If an unverified account exists, a verification email will be sent.' };
    }

    const emailVerifyToken = this.generateToken();
    const emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        emailVerifyToken,
        emailVerifyExpires,
      },
    });

    // Send verification email
    const emailSent = await this.emailService.sendVerificationEmail(customer.email, emailVerifyToken);

    return {
      message: 'If an unverified account exists, a verification email will be sent.',
      emailSent,
    };
  }

  async forgotPassword(email: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!customer) {
      return { message: 'If an account exists, a password reset link will be sent.' };
    }

    const passwordResetToken = this.generateToken();
    const passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Send password reset email
    const emailSent = await this.emailService.sendPasswordResetEmail(customer.email, passwordResetToken);

    return {
      message: 'If an account exists, a password reset link will be sent.',
      emailSent,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { passwordResetToken: token },
    });

    if (!customer) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (customer.passwordResetExpires && customer.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async validateResetToken(token: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { passwordResetToken: token },
    });

    if (!customer) {
      return { valid: false, message: 'Invalid reset token' };
    }

    if (customer.passwordResetExpires && customer.passwordResetExpires < new Date()) {
      return { valid: false, message: 'Reset token has expired' };
    }

    return { valid: true, email: customer.email };
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
        isEmailVerified: true,
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
