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
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';

@ApiTags(Tag.AUTHENTICATE)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'validate blockchain wallet is stored or not' })
  @ApiResponse({ status: 200, description: 'User info is exist in system' })
  @ApiResponse({
    status: 201,
    description: 'Pending user info have created sussessfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server' })
  @Post()
  @Public()
  handleValidate(@Body() userInfo: UserInfo, @Res() res) {
    return this.authService.handleValidate(userInfo, res);
  }

  @ApiOperation({
    summary: 'get access token and refresh token after validate',
  })
  @ApiResponse({
    status: 200,
    description: 'Success get access and refresh token',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid user',
  })
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  handleLogin(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'confirm wallet identity' })
  @ApiResponse({
    status: 201,
    description: 'Success confirm user and save user info',
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request - Can't find user wallet in pending user/ Invalid wallet or fee payer",
  })
  @ApiResponse({ status: 404, description: 'Not Found - Invalid signature' })
  @ApiResponse({
    status: 502,
    description:
      "Bad Gateway - Memo program couldn't be verified/ Could not verify signatures",
  })
  @Post('confirm')
  @Public()
  @HttpCode(HttpStatus.OK)
  handleConfirm(@Body() confirmInfo: ConfirmInfo) {
    return this.authService.handleConfirm(confirmInfo);
  }

  @ApiExcludeEndpoint()
  @Get('admin')
  @Roles(Role.ADMIN)
  testingAdminAccess(@Req() req) {
    return req.user;
  }

  @ApiOperation({ summary: 'refresh access token' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Successful operation' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @Public()
  @UseGuards(RefreshAuthGuard)
  @Get('refresh')
  @HttpCode(HttpStatus.CREATED)
  handleRefreshToken(@Req() req) {
    return this.authService.refreshAccessToken(req.user);
  }
}
