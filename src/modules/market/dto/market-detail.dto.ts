import { ApiProperty } from '@nestjs/swagger';

class AnswerStatsDto {
  @ApiProperty({ example: 'Yes' })
  name: string;

  @ApiProperty({
    example: 24.81,
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
  @ApiProperty({ example: 2, description: 'Number of voters' })
  numVoters: number;

  @ApiProperty({ example: 31.01, description: 'Total volume of the market' })
  totalVolume: number;

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
}

class VoterAccountDto {
  @ApiProperty({ example: 254, description: 'Bump seed for the PDA' })
  bump: number;

  @ApiProperty({ example: '0bff', description: 'Unique key for the market' })
  marketKey: string;

  @ApiProperty({
    example: 'Yes',
    description: 'The answer key chosen by the voter',
  })
  answerKey: string;

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
