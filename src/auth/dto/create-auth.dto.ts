import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateAuthDto {}

export class UserInfo {
  @ApiProperty()
  @IsNotEmpty()
  wallet: string;

  @ApiProperty()
  @IsNotEmpty()
  isLedger: boolean;
}

export class ConfirmInfo {
  @ApiProperty()
  @IsNotEmpty()
  wallet: string;

  @ApiProperty()
  @IsNotEmpty()
  isLedger: boolean;

  @ApiProperty()
  @IsNotEmpty()
  signature: string;

  @ApiProperty()
  @IsNotEmpty()
  nonce: string;
}

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'walletAddress is required' })
  walletAddress: string;
}
