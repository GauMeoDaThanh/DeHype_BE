import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 'username123' })
  username: string;

  @ApiProperty({ example: '0x1234567890abcdef' })
  walletAddress: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatarUrl: string;
}

export class ReplyDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'This is a reply comment.' })
  comment: string;

  @ApiProperty({ example: '2024-10-15T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-10-15T12:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class CommentDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'This is a comment.' })
  comment: string;

  @ApiProperty({ example: '2024-10-15T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-10-15T12:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ type: [ReplyDto] })
  replies: ReplyDto[];

  @ApiProperty({ type: UserDto })
  user: UserDto;
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

export class GetMarketCommentsResponse {
  @ApiProperty({ type: [CommentDto] })
  comments: CommentDto[];

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;
}
