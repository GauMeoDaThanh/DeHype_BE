import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfirmInfo, CreateAuthDto, UserInfo } from './dto/create-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { Request } from 'express';
import { userInfo } from 'os';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  handleValidate(@Body() userInfo: UserInfo) {
    return this.authService.handleValidate(userInfo);
  }

  @Post('login')
  handleLogin(@Req() req) {
    return this.authService.login(req);
  }

  @Post('confirm')
  handleConfirm(@Body() confirmInfo: ConfirmInfo) {
    return this.authService.handleValidate(confirmInfo);
  }
}
