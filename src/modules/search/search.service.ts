import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SearchMarketQueryDto } from './dto/create-search.dto';
import { UpdateSearchDto } from './dto/update-search.dto';
import { MarketService } from '../market/market.service';
import { CategoryService } from '../category/category.service';
import { FavMarketService } from '../fav-market/fav-market.service';

@Injectable()
export class SearchService {
  constructor(
    private marketService: MarketService,
    private categoryService: CategoryService,
    private favMarketService: FavMarketService,
  ) {}

  async findAll(searchText: string) {
    try {
      if (!searchText || !searchText.trim()) {
        return [];
      }
      const result = await this.marketService.findMarketByName(
        searchText.trim(),
      );
      return result;
    } catch (error) {
      console.error('Error in searching market globally:', error);
      throw new InternalServerErrorException(
        'Error in searching market globally',
      );
    }
  }

  async findAllDetails(
    searchMarketqueryDto: SearchMarketQueryDto,
    wallet?: string,
  ) {
    const { q, c, fav } = searchMarketqueryDto;
    if (c) var categoryIds = c?.split(',').map((id) => parseInt(id));
    let finalMarketIds = [];

    if (fav) {
      finalMarketIds = await this.favMarketService.findMarketIdsInFav(
        wallet,
        categoryIds,
        q,
      );
    } else if (categoryIds && categoryIds.length > 0) {
      finalMarketIds = await this.marketService.findMarketIdsByCategory(
        categoryIds,
        q,
      );
    } else {
      finalMarketIds = await this.marketService.findMarketIdsByName(q);
    }

    if (q || c || fav) {
      return await this.marketService.getBatchMarkets(finalMarketIds);
    } else {
      return await this.marketService.getMarkets();
    }
  }
}
