import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsString, IsNotEmpty } from 'class-validator';

class AnswerStatsDto {
  @ApiProperty({ description: 'answer key', example: '1' })
  key: string;

  @ApiProperty({ example: 'Yes' })
  name: string;

  @ApiProperty({
    example: '01718c7e00',
    description: 'Total tokens allocated to this answer',
  })
  totalTokens: number;

  @ApiProperty({ example: 31.01, description: 'Total volume for this answer' })
  totalVolume: number;

  @ApiProperty({
    example: '80.01',
    description: 'Percentage allocation of this answer',
  })
  percentage: string;
}

export class MarketStatsDto {
  @ApiProperty({
    example: 'EE5GY3PzUSM8mewPazm',
    description: 'Public key of the market',
  })
  publicKey: string;

  @ApiProperty({
    type: [AnswerStatsDto],
    description: 'Statistics for each answer in the market',
  })
  answerStats: AnswerStatsDto[];
}

export class MarketDetailDto {
  @ApiProperty({ example: 255, description: 'Bump seed for the PDA' })
  bump: number;

  @ApiProperty({ example: 255, description: 'Bump seed for the vault PDA' })
  bumpVault: number;

  @ApiProperty({
    example: 'FECRGdR7EBXD7wPs1d1i',
    description: 'Public key of the creator',
  })
  creator: string;

  @ApiProperty({ example: '0bff', description: 'Unique key for the market' })
  marketKey: string;

  @ApiProperty({
    example: 'Will SOL reached ATH at the end of this cycle',
    description: 'Title of the market',
  })
  title: string;

  @ApiProperty({
    example: '01',
    description: 'Creator fee percentage in hex format',
  })
  creatorFeePercentage: string;

  @ApiProperty({
    example: '0738570c80',
    description: 'Total market tokens in hex format',
  })
  marketTotalTokens: string;

  @ApiProperty({
    example:
      "<p>Will SOL reached ATH at the end of this cycle?. Let's find out</p>",
    description: 'Description of the market',
  })
  description: string;

  @ApiProperty({
    example: '00',
    description: 'Correct answer key in hex format',
  })
  correctAnswerKey: string;

  @ApiProperty({ example: true, description: 'Market active status' })
  isActive: boolean;

  @ApiProperty({
    example: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
    description: 'URL of the cover image',
  })
  coverUrl: string;

  @ApiProperty({
    description: 'List of categories that the market belongs to',
  })
  categories: string[];
}

class VoterAccountDto {
  @ApiProperty({ example: 254, description: 'Bump seed for the PDA' })
  bump: number;

  @ApiProperty({ example: '0bff', description: 'Unique key for the market' })
  marketKey: string;

  @ApiProperty({ description: 'Unique key for the answer', example: '1' })
  answerKey: string;

  @ApiProperty({
    example: 'Yes',
    description: 'The answer key chosen by the voter',
  })
  answerName: string;

  @ApiProperty({
    example: 'FECRGdR7EBXD7',
    description: 'Public key of the voter',
  })
  voter: string;

  @ApiProperty({ example: 24.81, description: 'Tokens allocated by the voter' })
  tokens: number;

  @ApiProperty({
    example: 'Sat, 19 Oct 2024 07:04:07 GMT',
    description: 'Creation time of the vote',
  })
  createTime: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the voter account exists',
  })
  exist: boolean;
}

export class VoterDto {
  @ApiProperty({
    example: 'EE5GY3PzUSM8mewPazm',
    description: 'Public key of the voter',
  })
  publicKey: string;

  @ApiProperty({ description: 'username of the voter' })
  username: string;

  @ApiProperty({
    description: 'avatar of the voter',
  })
  avatarUrl: string;

  @ApiProperty({
    example: 24.81,
    description: 'Total usd value of the bets placed by the voter',
  })
  totalBet: number;

  @ApiProperty({
    type: VoterAccountDto,
    description: 'Details of the voter account',
  })
  account: VoterAccountDto;
}

export class VoterListDto {
  @ApiProperty({
    type: [VoterDto],
    description: 'List of voters in the market',
  })
  voters: VoterDto[];
}

export class GetMarketsStatsDto {
  @ApiProperty({
    description: 'Array of market public keys',
    type: [String],
    example: ['market1pubkey', 'market2pubkey'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  marketIds: string[];
}
export class GetAllMarketReponse {
  @ApiProperty({ example: 'D1aphTvapSBD7ELKeMghYFFfFRkcKzqgJadP13oRgF1z' })
  publicKey: string;

  @ApiProperty({ example: 255 })
  bump: number;

  @ApiProperty({ example: 255 })
  bumpVault: number;

  @ApiProperty({ example: 'FECRGdR7EBXD7wPs1d1iV5VCqUrTSb6RgDizdvRkcZZY' })
  creator: string;

  @ApiProperty({ example: '07af' })
  marketKey: string;

  @ApiProperty({ example: 'Will SOL reached 1000$ at the end of this year?' })
  title: string;

  @ApiProperty({ example: '01' })
  creatorFeePercentage: string;

  @ApiProperty({ example: '00' })
  marketTotalTokens: string;

  @ApiProperty({
    example: '<p>Will SOL reached 1000$ at the end of this year?</p>',
  })
  description: string;

  @ApiProperty({ example: '00' })
  correctAnswerKey: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
  })
  coverUrl: string;

  @ApiProperty({ example: 1 })
  view: number;

  @ApiProperty({ example: 0 })
  like: number;

  @ApiProperty({ example: '2024-11-05T00:13:17.353Z' })
  createdAt: string;

  @ApiProperty({ example: 0 })
  totalVolume: number;

  @ApiProperty({ example: 3 })
  numVoters: number;
}

export class SimpleMarketResponse {
  @ApiProperty({ example: 'J7TLfthtDwdYx3wtMJeaPL27bAJQ4pjgmemaude57BCP' })
  marketId: string;

  @ApiProperty({ example: 'Will SOL reached ATH at the end of this cycle' })
  title: string;

  @ApiProperty({
    example: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
  })
  coverUrl: string;

  @ApiProperty({ example: 0 })
  view: number;

  @ApiProperty({ example: 0 })
  like_count: number;

  @ApiProperty({ example: '2024-11-05T00:13:17.353Z' })
  createdAt: string;
}
