import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { MarketModule } from '../market/market.module';
import { CategoryModule } from '../category/category.module';
import { FavMarketModule } from '../fav-market/fav-market.module';

@Module({
  imports: [MarketModule, CategoryModule, FavMarketModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
