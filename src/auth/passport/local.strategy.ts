import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'walletAddress',
      passwordField: 'signature',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, walletAddress: string): Promise<any> {
    const { signedMessage, signature } = req.body;

    const user = await this.authService.validateUser(walletAddress);
    if (!user) {
      throw new UnauthorizedException("Can't verify public key");
    }
    return user;
  }
}
