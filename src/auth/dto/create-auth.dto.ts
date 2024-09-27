import { IsNotEmpty } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'WalletAddress must be filled' })
  walletAddress: string;
}
