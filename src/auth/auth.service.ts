import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
import nacl, { randomBytes } from 'tweetnacl';
import { ConfirmInfo, LoginDto, UserInfo } from './dto/create-auth.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { pseudoRandomBytes } from 'crypto';
import base58 from 'bs58';
import { PublicKey, Transaction } from '@solana/web3.js';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleValidate(userInfo: UserInfo, res: Response) {
    try {
      const wallet = userInfo.wallet;
      const userData = await this.userService.findOne(wallet);
      if (userData) return res.status(HttpStatus.OK).send(userData);

      const pendingUser = await this.userService.getPendingUser(wallet);
      if (!pendingUser) {
        const nonce = pseudoRandomBytes(8).toString('hex');
        const newPendingUser = await this.userService.createPendingUser({
          wallet,
          nonce,
          isLedger: userInfo.isLedger,
        });
        return res.status(HttpStatus.CREATED).send(newPendingUser);
      } else {
        return res.status(HttpStatus.OK).send(pendingUser);
      }
    } catch (error) {
      console.error('Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error });
    }
  }

  async login(loginDto: LoginDto) {
    const { walletAddress } = loginDto;

    const user = await this.userService.getUser(walletAddress);
    if (!user) throw new UnauthorizedException('Wallet not found');

    const accessPayload = {
      username: user.username,
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

  async handleConfirm(confirmInfo: ConfirmInfo) {
    const { wallet, isLedger, signature, nonce } = confirmInfo;

    const foundNonce = await this.userService.removePendingUserByNonce(nonce);
    if (!foundNonce) throw new BadRequestException('Your request expired');

    if (!isLedger) {
      const signatureUnit8 = base58.decode(signature);
      const msgUnit8 = new TextEncoder().encode(
        `${this.configService.get<string>('SIGN_IN_MSG')}${foundNonce.nonce}`,
      );
      const publicKeyUnit8 = base58.decode(wallet);
      const isValidSignature = nacl.sign.detached.verify(
        msgUnit8,
        signatureUnit8,
        publicKeyUnit8,
      );

      if (!isValidSignature) throw new NotFoundException('Invalid Signature');
    } else {
      const ledgerSerializedTx = JSON.parse(signature);
      const signedTx = Transaction.from(Uint8Array.from(ledgerSerializedTx));

      const feePayer = signedTx.feePayer?.toBase58() || '';
      if (feePayer != wallet)
        throw new BadRequestException('Invalid wallet or fee payer');
      const MEMO_PROGRAM_ID = new PublicKey(
        'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
      );

      const inx = signedTx.instructions.find(
        (ix) => ix.programId.toBase58() == MEMO_PROGRAM_ID.toBase58(),
      );
      if (!inx)
        throw new BadGatewayException("Memo program couldn't be verified");

      if (!signedTx.verifySignatures())
        throw new BadGatewayException('Could not verify signatures');
    }

    return await this.userService.createUser({ walletAddress: wallet });
  }

  async refreshAccessToken(req: any) {
    const { walletAddress } = req;
    const user = await this.userService.getUser(walletAddress);

    if (!user) throw new UnauthorizedException('Wallet not found');

    const accessPayload = {
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(accessPayload),
    };
  }
}
