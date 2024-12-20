import { ApiProperty } from '@nestjs/swagger';

export class UserResultDto {
  @ApiProperty({ example: '12341431safa123' })
  walletAddress: string;

  @ApiProperty({ example: 'dehype' })
  username: string;

  @ApiProperty({ example: 'http://example.com/thumbnail.jpg' })
  avatarUrl: string;

  @ApiProperty({ example: 'user' })
  role: string;
}

export class MetaDto {
  @ApiProperty({ example: 1 })
  current: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 5 })
  pages: number;

  @ApiProperty({ example: 50 })
  total: number;
}

export class GetUserReponse {
  @ApiProperty({ type: [UserResultDto] })
  users: UserResultDto[];

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;
}

class MarketBetResponse {
  @ApiProperty({ example: '12341431safa123' })
  marketId: string;

  @ApiProperty({ example: 'Wil SoL become second BTC?' })
  marketTitle: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  marketCoverUrl: string;

  @ApiProperty({ example: 1000 })
  totalBet: number;

  @ApiProperty({ example: 500 })
  tokens: number;

  @ApiProperty({ example: 'Yes' })
  answerKey: string;

  @ApiProperty({ example: '2021-05-20T00:00:00.000Z' })
  createTime: Date;
}

class UserInBettingHistoryReponse {
  @ApiProperty({ example: '12341431safa123' })
  walletAddress: string;

  @ApiProperty({ example: 'dehype' })
  username: string;
}

export class UserBettingHistoryResponse {
  @ApiProperty({ type: UserInBettingHistoryReponse })
  user: UserInBettingHistoryReponse;

  @ApiProperty({ type: [MarketBetResponse] })
  bets: MarketBetResponse[];
}
