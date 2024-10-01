import { IsNotEmpty } from 'class-validator';

export class CreateAuthDto {}

export class UserInfo {
  @IsNotEmpty()
  wallet: string;

  @IsNotEmpty()
  isLedger: boolean;
}

export class ConfirmInfo {
  @IsNotEmpty()
  wallet: string;

  @IsNotEmpty()
  isLedger: boolean;

  @IsNotEmpty()
  signature: string;

  @IsNotEmpty()
  nonce: string;
}
