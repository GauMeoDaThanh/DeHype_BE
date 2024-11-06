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
  publicKey: PublicKey;
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
