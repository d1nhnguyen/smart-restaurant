import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CustomerJwtAuthGuard } from './customer-jwt-auth.guard';

@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  async register(@Body() registerDto: CustomerRegisterDto) {
    return this.customerAuthService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: CustomerLoginDto) {
    return this.customerAuthService.login(loginDto);
  }

  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    return this.customerAuthService.checkEmailAvailability(email);
  }

  // Email verification
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.customerAuthService.verifyEmail(token);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@Request() req) {
    return this.customerAuthService.resendVerificationEmail(req.user.id);
  }

  // Resend verification by email (for users who haven't verified yet, no auth required)
  @Post('resend-verification-email')
  async resendVerificationByEmail(@Body() body: { email: string }) {
    return this.customerAuthService.resendVerificationByEmail(body.email);
  }

  // Password reset
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.customerAuthService.forgotPassword(forgotPasswordDto.email);
  }

  @Get('validate-reset-token/:token')
  async validateResetToken(@Param('token') token: string) {
    return this.customerAuthService.validateResetToken(token);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.customerAuthService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.customerAuthService.getProfile(req.user.id);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.customerAuthService.updateProfile(req.user.id, updateDto);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Put('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.customerAuthService.changePassword(req.user.id, changePasswordDto);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get('orders')
  async getOrderHistory(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.customerAuthService.getOrderHistory(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
