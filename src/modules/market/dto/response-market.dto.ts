import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

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
