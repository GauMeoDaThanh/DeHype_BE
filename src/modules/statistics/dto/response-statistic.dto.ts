import { ApiProperty } from '@nestjs/swagger';

export class MemberStatisticsResponse {
  @ApiProperty({ description: 'Total member' })
  totalMembers: number;

  @ApiProperty({ description: 'period of time' })
  period: string;
}

export class TransactionStatisticsResponse {
  @ApiProperty({ description: 'Total transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'period of time' })
  period: string;
}

export class TransactionVolumeStatisticsResponse {
  @ApiProperty({ description: 'Total transactions volume' })
  totalVolumes: number;

  @ApiProperty({ description: 'period of time' })
  period: string;
}

export class MostBettingLeaderboardResponse {
  @ApiProperty({ description: 'wallet address' })
  walletAddress: string;

  @ApiProperty({ description: 'user name' })
  username: string;

  @ApiProperty({ description: 'avatar url' })
  avatarUrl: string;

  @ApiProperty({ description: 'total betting' })
  totalBetting: number;
}
