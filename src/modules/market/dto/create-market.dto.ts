import { ApiProperty } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { IsNotEmpty, IsNumber, IsOptional, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateMarketTransactionDto {
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

export class CreateMarketDto {
  // @ApiProperty({
  //   type: 'string',
  //   format: 'binary',
  //   description: 'Cover image of the market',
  // })
  // file: Express.Multer.File;

  @IsNotEmpty()
  @ApiProperty({ description: 'market puclic key' })
  marketPublicKey: string;

  @IsOptional()
  @ApiProperty({ description: 'market private key' })
  marketKey: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'title of market' })
  title: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'cover image url' })
  coverUrl: string;

  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @ApiProperty({ description: 'category list' })
  categoryIds: number[];
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
  @ApiProperty({ description: 'the result of market' })
  @IsNotEmpty()
  winningOutcome: string; // The winning outcome to resolve the market
  @ApiProperty({ description: 'the user resolver public key' })
  @IsNotEmpty()
  userPublicKey: string;
}

// export class GetMarketsDto {
//   @IsOptional()
//   category: string;
//   @IsOptional()
//   trending: boolean;
// }

export class GetMarketSummaryDto {
  @ApiProperty({ description: 'title of market' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'description of market' })
  @IsNotEmpty()
  description: string;
}

export class GetVoterHistoryQueryDto {
  @ApiProperty({ description: 'The min amount of bet', required: false })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  min: number;
}

export class GetVoterRewardDto{
  @ApiProperty({ description: 'The public key of the user' })
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ description: 'The market public key' })
  @IsNotEmpty()
  marketPublicKey: string;
}