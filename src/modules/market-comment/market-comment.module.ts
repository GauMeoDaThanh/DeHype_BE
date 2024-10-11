import { Module } from '@nestjs/common';
import { MarketCommentService } from './market-comment.service';
import { MarketCommentController } from './market-comment.controller';
import { MarketComment } from './entities/market-comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MarketComment])],
  controllers: [MarketCommentController],
  providers: [MarketCommentService],
})
export class MarketCommentModule {}
