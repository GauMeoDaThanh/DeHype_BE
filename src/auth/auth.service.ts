import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import nacl from 'tweetnacl';
import { ConfirmInfo, CreateAuthDto, UserInfo } from './dto/create-auth.dto';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleValidate(userInfo: UserInfo) {

  }

  async login(walletAddress: string) {
    const user = await this.userService.getUser(walletAddress);

    if (!user) throw new UnauthorizedException("Can't find wallet address");

    const accessPayload = {
      walletAddress: user.walletAddress,
      role: user.role,
    };

    const refreshPayload = {
      walletAddress: user.walletAddress,
    };

    return {
      access_token: this.jwtService.sign(accessPayload),
      refresh_token: this.jwtService.sign(refreshPayload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRED'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }),
    };
  }

  async handleConfirm(confirmInfo: ConfirmInfo) {}
}
