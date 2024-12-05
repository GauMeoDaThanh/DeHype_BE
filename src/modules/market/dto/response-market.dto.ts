import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { ApiProperty } from '@nestjs/swagger';

export type MarketAccount = {
  bump: number; // u8
  creator: PublicKey; // publicKey
  marketKey: BN; // u64 (BN for large numbers)
  title: string; // string
  creatorFeePercentage: BN; // u64 (BN for large numbers)
  serviceFeePercentage: BN; // u64 (BN for large numbers)
  marketTotalTokens: BN; // u64 (BN for large numbers)
  marketRemainTokens: BN; // u64 (BN for large numbers)
  description: string; // string
  correctAnswerKey: BN; // u64 (BN for large numbers)
  isActive: boolean; // bool
  coverUrl: string; // string
};

export type MarketResponse = {
  publicKey: PublicKey | string;
  account: MarketAccount;
};

export type Answer = {
  answerKey: BN; // Unique key for the answer
  name: string; // Display name of the answer
  answerTotalTokens: BN; // Total tokens associated with the answer
  outcomeTokenName: string; // Name of the outcome token
  outcomeTokenLogo: string; // URL of the outcome token logo
};

export type AnswerAccount = {
  bump: number;
  answers: Answer[];
  marketKey: string;
};

export type BettingAccount = {
  bump: number;
  marketKey: BN;
  answerKey: BN;
  voter: PublicKey;
  tokens: BN;
  createTime: BN;
  exist: boolean;
};

export type BettingAccountResponse = {
  publicKey: PublicKey;
  account: BettingAccount;
};

class MarketOptionStatDataDto {
  @ApiProperty({
    description: 'Name of the market option.',
    example: 'Yes',
  })
  name: string;

  @ApiProperty({
    description: 'Percentage associated with the market option.',
    example: '80.01',
  })
  percentage: string;
}

export class MarketOptionStatDto {
  @ApiProperty({
    description: 'Timestamp for the market option statistics.',
    example: '2024-11-21T11:53:50.169Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'List of market option data.',
    type: [MarketOptionStatDataDto],
  })
  data: MarketOptionStatDataDto[];
}

export class MarketLiveUpdateResponseDto {
  @ApiProperty({
    description: 'The public key of the market.',
    example: '7GL9fMUzY9r6WPCvJbtbJAhNdLr1h8pNf9Je9oqjxapf',
  })
  marketPubKey: string;

  @ApiProperty({
    description: 'Message or type of state.',
    example: 'Initial data',
  })
  state: string;

  @ApiProperty({
    description: 'Statistics of the market options over time.',
    type: [MarketOptionStatDto],
  })
  stats: MarketOptionStatDto[];
}

