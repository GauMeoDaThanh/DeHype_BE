import { ApiProperty } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { IsNotEmpty } from 'class-validator';

export class CreateMarketDto {
  @ApiProperty({ description: 'The name of the event' })
  eventName: string;

  @ApiProperty({
    description: 'The outcome options for the event',
    type: [String],
  })
  outcomeOptions: string[];

  @ApiProperty({ description: 'The public key of the user' })
  userPublicKey: string;
}

export class CreateBetDto {
  @ApiProperty()
  @IsNotEmpty()
  marketKey: BN;

  @ApiProperty()
  @IsNotEmpty()
  betAmount: BN;

  @ApiProperty()
  @IsNotEmpty()
  answerKey: BN;
}

export class ResolveMarketDto {
  marketAddress: string; // Public key of the market as a string
  winningOutcome: string; // The winning outcome to resolve the market
  userPublicKey: string;
}
