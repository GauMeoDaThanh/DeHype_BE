import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateMarketCommentDto,
  ParamCreateReplyDto,
} from './dto/create-market-comment.dto';
import {
  ParamUpdateCommentDto,
  UpdateMarketCommentDto,
} from './dto/update-market-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MarketComment } from './entities/market-comment.entity';
import { IsNull, Repository } from 'typeorm';
import { Role } from 'src/constants/role.enum';
import aqp from 'api-query-params';
import {
  GetMarketCommentsResponse,
  MetaDto,
} from './dto/read-market-comment.dto';

@Injectable()
export class MarketCommentService {
  constructor(
    @InjectRepository(MarketComment)
    private marketCommentRepository: Repository<MarketComment>,
  ) {}

  async isCommentOwnerOrAdmin(commentId: string, user: any) {
    const comment = await this.marketCommentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found.`);
    }

    return (
      user.role === Role.ADMIN ||
      comment.user.walletAddress === user.walletAddress
    );
  }

  async createComment(
    marketId: string,
    createMarketCommentDto: CreateMarketCommentDto,
    walletAddress: string,
  ) {
    const newComment = this.marketCommentRepository.create({
      comment: createMarketCommentDto.content,
      marketId: marketId,
      user: { walletAddress: walletAddress },
    });

    return await this.marketCommentRepository.save(newComment);
  }

  async replyComment(
    params: ParamCreateReplyDto,
    createMarketCommentDto: CreateMarketCommentDto,
    walletAddress: string,
  ) {
    const parentComment = await this.marketCommentRepository.findOne({
      where: { id: params.parentCommentId },
      relations: ['parentComment'],
    });

    if (!parentComment)
      throw new NotFoundException(
        `Parent comment with ID ${params.parentCommentId} not found`,
      );

    if (parentComment.parentComment) {
      throw new BadRequestException({
        message: 'You cannot reply to a reply.',
        reason: 'Only top-level comments can be replied to.',
      });
    }
    const newComment = this.marketCommentRepository.create({
      comment: createMarketCommentDto.content,
      marketId: params.marketId,
      user: { walletAddress: walletAddress },
      parentComment: { id: params.parentCommentId },
    });

    return await this.marketCommentRepository.save(newComment);
  }

  async update(
    params: ParamUpdateCommentDto,
    updateMarketCommentDto: UpdateMarketCommentDto,
    user: any,
  ) {
    const isCommentOwnerOrAdmin = await this.isCommentOwnerOrAdmin(
      params.commentId,
      user,
    );

    if (!isCommentOwnerOrAdmin)
      throw new ForbiddenException(
        'You do not have permission to update this comment',
      );

    return await this.marketCommentRepository.update(params.commentId, {
      comment: updateMarketCommentDto.content,
    });
  }

  async remove(params: ParamUpdateCommentDto, user: any) {
    const isCommentOwnerOrAdmin = await this.isCommentOwnerOrAdmin(
      params.commentId,
      user,
    );

    if (!isCommentOwnerOrAdmin)
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );

    const comment = await this.marketCommentRepository.findOne({
      where: { id: params.commentId },
      relations: ['parentComment'],
    });

    if (comment.parentComment === null) {
      await this.marketCommentRepository
        .createQueryBuilder()
        .delete()
        .from(MarketComment)
        .where('parentComment = :commentId', { commentId: params.commentId })
        .execute();
    }

    return await this.marketCommentRepository.delete(params.commentId);
  }

  async findAllMarketComments(query: string, marketId: string) {
    const { filter, sort } = aqp(query);
    let { pageSize, current, ...restFilter } = filter;

    if (!pageSize) pageSize = 10;
    if (!current) current = 1;

    const [results, totalItems] =
      await this.marketCommentRepository.findAndCount({
        relations: ['replies', 'user', 'replies.user'],
        where: { parentComment: IsNull(), marketId: marketId, ...restFilter },
        order: sort,
        take: pageSize,
        skip: (current - 1) * pageSize,
      });

    const customizedResults = results.map((result) => ({
      id: result.id,
      comment: result.comment,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      replies: result.replies.map((reply) => ({
        id: reply.id,
        comment: reply.comment,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        user: {
          username: reply.user.username,
          walletAddress: reply.user.walletAddress,
          avatarUrl: reply.user.avatarUrl,
        },
      })),
      user: {
        walletAddress: result.user.walletAddress,
        username: result.user.username,
        avatarUrl: result.user.avatarUrl,
      },
    }));

    const meta: MetaDto = {
      current: current,
      pageSize: pageSize,
      pages: Math.ceil(totalItems / pageSize),
      total: totalItems,
    };

    const response: GetMarketCommentsResponse = {
      comments: customizedResults,
      meta: meta,
    };

    return response;
  }
  catch(error) {
    throw new InternalServerErrorException('Something happen');
  }
}
