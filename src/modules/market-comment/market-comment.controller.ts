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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import { Public } from 'src/decorators/public-route';
import { GetMarketCommentsResponse } from './dto/response-market-comment.dto';

@ApiTags(Tag.MARKET_COMMENT)
@Controller('markets')
export class MarketCommentController {
  constructor(private readonly marketCommentService: MarketCommentService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'create new comment' })
  @ApiResponse({ status: 201, description: 'Successful operation' })
  @Post(':marketId/comments')
  createComment(
    @Param('marketId') marketId: string,
    @Body() createMarketCommentDto: CreateMarketCommentDto,
    @Wallet() walletAddress: string,
  ) {
    return this.marketCommentService.createComment(
      marketId,
      createMarketCommentDto,
      walletAddress,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'create reply comment' })
  @ApiParam({ name: 'marketId', type: String })
  @ApiParam({ name: 'parentCommentId', type: String })
  @ApiResponse({ status: 201, description: 'Successful operation' })
  @ApiResponse({
    status: 404,
    description: "Not Found - Can't find the parent comment",
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Only top-level comments can be replied to',
  })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update comment' })
  @ApiParam({ name: 'marketId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiResponse({ status: 200, description: 'Successfull operation' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not have permission to update',
  })
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

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'delete comment',
    description:
      'a comment can be deleted by the user who posted it or by an admin. If it is a parent comment, all sub comments will be deleted too',
  })
  @ApiParam({ name: 'marketId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiResponse({ status: 200, description: 'Successfull operation' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not have permission to delete',
  })
  @Delete(':marketId/comments/:commentId')
  remove(@Param() params: ParamUpdateCommentDto, @User() user: any) {
    return this.marketCommentService.remove(params, user);
  }

  @ApiOperation({ summary: 'get market comments' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of record each page',
  })
  @ApiQuery({ name: 'current', required: false, description: 'Current page' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of record each page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Current page',
    example: '-createdAt',
  })
  @ApiResponse({
    status: 200,
    description: 'Retrieved market comments successfully',
    type: GetMarketCommentsResponse,
  })
  @Public()
  @Get(':marketId/comments')
  findAll(
    @Query() query: string,
    @Param('marketId') marketId: string,
  ): Promise<GetMarketCommentsResponse> {
    return this.marketCommentService.findAllMarketComments(query, marketId);
  }
}
