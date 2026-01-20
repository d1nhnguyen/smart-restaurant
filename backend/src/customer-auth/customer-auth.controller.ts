import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
