import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { MarketCommentService } from './market-comment.service';
import {
  ParamUpdateCommentDto,
  UpdateMarketCommentDto,
} from './dto/update-market-comment.dto';
import { CreateMarketDto } from '../market/dto/create-market.dto';
import {
  CreateMarketCommentDto,
  ParamCreateReplyDto,
} from './dto/create-market-comment.dto';
import { Wallet } from 'src/decorators/current-wallet';
import { User } from 'src/decorators/current-user';

@Controller('markets')
export class MarketCommentController {
  constructor(private readonly marketCommentService: MarketCommentService) {}

  @Post(':marketId/comments')
  createComment(
    @Param('marketId') marketId: string,
    @Body() createMarketCommentDto: CreateMarketCommentDto,
    @Wallet() walletAddress: string,
  ) {
    console.log(walletAddress);
    return this.marketCommentService.createComment(
      marketId,
      createMarketCommentDto,
      walletAddress,
    );
  }

  @Post(':marketId/comments/:parentCommentId/replies')
  handleReply(
    @Param() params: ParamCreateReplyDto,
    @Body() createMarketCommentDto: CreateMarketCommentDto,
    @Wallet() walletAddress: string,
  ) {
    return this.marketCommentService.replyComment(
      params,
      createMarketCommentDto,
      walletAddress,
    );
  }

  @Patch(':marketId/comments/:commentId')
  update(
    @Param() params: ParamUpdateCommentDto,
    @Body() updateMarketCommentDto: UpdateMarketCommentDto,
    @User() user: any,
  ) {
    return this.marketCommentService.update(
      params,
      updateMarketCommentDto,
      user,
    );
  }

  @Delete(':marketId/comments/:commentId')
  remove(@Param() params: ParamUpdateCommentDto, @User() user: any) {
    return this.marketCommentService.remove(params, user);
  }

  @Get(':marketId/comments')
  findAll(@Query() query: string, @Param('marketId') marketId: string) {
    return this.marketCommentService.findAllMarketComments(query, marketId);
  }
}
