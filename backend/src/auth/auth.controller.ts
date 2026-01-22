import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Registration disabled - users are created by ADMIN only
  /*
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  */

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 100, ttl: 900000 } })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
