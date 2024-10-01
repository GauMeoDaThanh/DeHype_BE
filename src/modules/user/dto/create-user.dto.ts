import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'wallet address should not be empty' })
  walletAddress: string;

  @IsOptional()
  @IsIn(['user', 'admin'], { message: 'role must be either user or admin' })
  role: string;
}

export interface CreatePendingUser {
  walletAddress: string;
  isLedger: string;
  nonce: string;
}
