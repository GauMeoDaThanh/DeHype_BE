import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import nacl from 'tweetnacl';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(walletAddress: string): Promise<any> {
    // const isValidKey = nacl.sign.detached.verify(
    //   loginOutput.signedMessage,
    //   loginOutput.signature,
    //   loginOutput.account.publicKey,
    // );
    // const user = await this.userService.findOne(loginOutput.account.publicKey);
    const user = await this.userService.findOne(walletAddress);
    // if (!user || !isValidKey) return null;
    if (!user) return null;
    return user;
  }

  async login(user: User) {
    const accessPayload = {
      walletAddress: user.walletAddress,
      isAdmin: user.isAdmin,
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

  handleRegister = async (registerDto: CreateAuthDto) => {
    return await this.userService.create(registerDto);
  };
}
