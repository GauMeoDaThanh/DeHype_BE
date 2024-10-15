import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMarketCommentDto {
  @ApiProperty({ example: 'comment 1' })
  @IsNotEmpty()
  content: string;
}

export class ParamCreateReplyDto {
  @IsUUID('4', { message: 'Invalid UUID format for parentId' })
  parentCommentId: string;

  @IsNotEmpty()
  marketId: string;
}
