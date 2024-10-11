import {
  BadRequestException,
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

    if (!comment)
      throw new NotFoundException(`comment with ID ${commentId} not found`);

    if (user.role === Role.ADMIN) return true;
    else return comment.user.walletAddress === user.walletAddress;
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
      throw new UnauthorizedException(
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
      throw new UnauthorizedException(
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

  async findAll(query: string) {
    const { filter, sort } = aqp(query);
    let { pageSize, current, ...restFilter } = filter;

    const [results, totalItems] =
      await this.marketCommentRepository.findAndCount({
        relations: ['replies', 'user', 'replies.user'],
        where: { parentComment: IsNull() },
        order: sort,
        take: pageSize || 10,
        skip: ((current || 1) - 1) * (pageSize || 10),
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
          walletAddress: reply.user.walletAddress,
          avatarUrl: reply.user.avatarUrl,
        },
      })),
      user: {
        walletAddress: result.user.walletAddress,
        avatarUrl: result.user.avatarUrl,
      },
    }));

    return {
      comment: customizedResults,
      meta: {
        current: current,
        pageSize: pageSize,
        total: totalItems,
      },
    };
  }
  catch(error) {
    throw new InternalServerErrorException('Something happen');
  }
}
