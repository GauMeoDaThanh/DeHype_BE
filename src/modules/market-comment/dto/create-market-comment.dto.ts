import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMarketCommentDto {
  @IsNotEmpty()
  content: string;
}

export class ParamCreateReplyDto {
  @IsUUID('4', { message: 'Invalid UUID format for parentId' })
  parentCommentId: string;

  @IsNotEmpty()
  marketId: string;
}
