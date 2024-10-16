import { PartialType } from '@nestjs/mapped-types';
import { CreateMarketCommentDto } from './create-market-comment.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMarketCommentDto {
  @ApiProperty({ example: 'update comment 1' })
  @IsNotEmpty()
  content: string;
}

export class ParamUpdateCommentDto {
  @IsUUID('4', { message: 'Invalid UUID format for commentId' })
  commentId: string;

  @IsNotEmpty()
  marketId: string;
}
