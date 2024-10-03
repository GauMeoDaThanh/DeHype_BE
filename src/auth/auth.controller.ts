import {
  Body,
  Controller,
  Get,
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
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { RefreshAuthGuard } from './passport/refresh-auth.guard';
import { Roles } from 'src/decorators/role-route';
import { Role } from 'src/constants/role.enum';
import { Public } from 'src/decorators/public-route';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Public()
  handleValidate(@Body() userInfo: UserInfo, @Res() res) {
    return this.authService.handleValidate(userInfo, res);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  handleLogin(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('confirm')
  @Public()
  @HttpCode(HttpStatus.OK)
  handleConfirm(@Body() confirmInfo: ConfirmInfo) {
    return this.authService.handleConfirm(confirmInfo);
  }

  @Get('jwt')
  testingJWT(@Req() req) {
    return req.user;
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  testingAdminAccess(@Req() req) {
    return req.user;
  }

  @UseGuards(RefreshAuthGuard)
  @Get('refresh')
  @HttpCode(HttpStatus.CREATED)
  handleRefreshToken(@Req() req) {
    return this.authService.refreshAccessToken(req.user);
  }
}
