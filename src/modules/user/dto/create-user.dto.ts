import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'laskdflaskjva234jhas' })
  @IsNotEmpty({ message: 'wallet address should not be empty' })
  walletAddress: string;

  @ApiProperty({ example: 'user' })
  @IsOptional()
  @IsIn(['user', 'admin'], { message: 'role must be either user or admin' })
  role?: string;
}

export interface CreatePendingUserDto {
  wallet: string;
  isLedger: boolean;
  nonce: string;
}
