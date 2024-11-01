import { Module } from '@nestjs/common';
import { FavMarketService } from './fav-market.service';
import { FavMarketController } from './fav-market.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavMarket } from './entities/fav-market.entity';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavMarket]), MarketModule],
  controllers: [FavMarketController],
  providers: [FavMarketService],
  exports: [FavMarketService],
})
export class FavMarketModule {}
