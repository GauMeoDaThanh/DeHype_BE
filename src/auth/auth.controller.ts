import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ConfirmInfo,
  CreateAuthDto,
  LoginDto,
  UserInfo,
} from './dto/create-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { Request } from 'express';
import { userInfo } from 'os';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  handleValidate(@Body() userInfo: UserInfo, @Res() res) {
    return this.authService.handleValidate(userInfo, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  handleLogin(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  handleConfirm(@Body() confirmInfo: ConfirmInfo) {
    return this.authService.handleConfirm(confirmInfo);
  }
}
