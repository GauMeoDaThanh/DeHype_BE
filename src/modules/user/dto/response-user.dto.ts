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

  @ApiProperty({ example: false })
  isBlocked: boolean;
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
