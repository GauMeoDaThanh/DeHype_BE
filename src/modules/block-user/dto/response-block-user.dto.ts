import { ApiProperty } from '@nestjs/swagger';

export class CreateBlockUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'cheating' })
  blockReason: string;

  @ApiProperty({ example: { walletAddress: '1laskdflaskjva234jhas' } })
  user: {
    walletAddress: string;
  };

  @ApiProperty({ example: '2024-10-21T06:40:05.094Z' })
  blockedAt: Date;
}

export class BlockUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'cheating' })
  blockReason: string;

  @ApiProperty({ example: '2024-10-21T06:40:05.094Z' })
  blockedAt: Date;
}
