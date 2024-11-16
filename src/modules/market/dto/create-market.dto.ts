import { ApiProperty } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { IsNotEmpty, IsNumber, IsOptional, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @IsNotEmpty()
  @ApiProperty({ description: 'market puclic key' })
  marketPublicKey: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'title of market' })
  title: string;

  @IsNotEmpty()
  @IsUrl()
  @ApiProperty({ description: 'market cover url' })
  coverUrl: string;

  @IsNotEmpty()
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
  marketAddress: string; // Public key of the market as a string
  winningOutcome: string; // The winning outcome to resolve the market
  userPublicKey: string;
}

// export class GetMarketsDto {
//   @IsOptional()
//   category: string;
//   @IsOptional()
//   trending: boolean;
// }

export class GetVoterHistoryQueryDto {
  @ApiProperty({ description: 'The min amount of bet', required: false })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  min: number;
}
