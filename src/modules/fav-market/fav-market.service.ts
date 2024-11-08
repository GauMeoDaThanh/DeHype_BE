import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateFavMarketDto } from './dto/create-fav-market.dto';
import { UpdateFavMarketDto } from './dto/update-fav-market.dto';
import { MarketService } from '../market/market.service';
import { InjectRepository } from '@nestjs/typeorm';
import { FavMarket } from './entities/fav-market.entity';
import { Repository } from 'typeorm';
import aqp from 'api-query-params';
import { MetaDto } from '../user/dto/response-user.dto';

@Injectable()
export class FavMarketService {
  constructor(
    private marketService: MarketService,
    @InjectRepository(FavMarket)
    private favMarketRepository: Repository<FavMarket>,
  ) {}

  async addFavMarket(marketPubKey: string, walletAddress: string) {
    try {
      const isLiked = await this.favMarketRepository.existsBy({
        market: { marketId: marketPubKey },
        user: { walletAddress: walletAddress },
      });

      if (isLiked)
        throw new BadRequestException(
          `${walletAddress} already like the market with id ${marketPubKey}`,
        );

      const favMarket = this.favMarketRepository.create({
        user: { walletAddress: walletAddress },
        market: { marketId: marketPubKey },
      });
      this.favMarketRepository.save(favMarket);
      return await this.marketService.updateMarketLike(marketPubKey, true);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error in add favourite market');
    }
  }

  async removeFavMarket(marketPubKey: string, walletAddress: string) {
    try {
      this.favMarketRepository.delete({
        user: { walletAddress: walletAddress },
        market: { marketId: marketPubKey },
      });
      return await this.marketService.updateMarketLike(marketPubKey);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error in remove favourite market',
      );
    }
  }

  async getAllLikedMarket(walletAddress: string, query: string) {
    try {
      const { filter } = aqp(query);
      let { pageSize, current, ...restFilter } = filter;

      if (!pageSize) pageSize = 10;
      if (!current) current = 1;

      const [likedMarket, totalItems] =
        await this.favMarketRepository.findAndCount({
          where: { user: { walletAddress: walletAddress } },
          relations: ['market'],
          take: pageSize,
          skip: (current - 1) * pageSize,
        });

      const marketInfo = await Promise.all(
        likedMarket.map(async (marketInfo) => {
          return await this.marketService.getMarket(marketInfo.market.marketId);
        }),
      );

      const meta: MetaDto = {
        current: current,
        pageSize: pageSize,
        pages: Math.ceil(totalItems / pageSize),
        total: totalItems,
      };

      return { marketInfo, meta };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error in get all favourite market of wallet address ${walletAddress}`,
      );
    }
  }
  async findMarketIdsInFav(
    walletAddress: string,
    categoryIds?: number[],
    q?: string,
  ) {
    try {
      const query = this.favMarketRepository
        .createQueryBuilder('favMarket')
        .innerJoin('favMarket.market', 'market')
        .select('market.marketId')
        .distinct(true)
        .where('favMarket.user.walletAddress = :walletAddress', {
          walletAddress,
        });

      if (categoryIds && categoryIds.length > 0) {
        query
          .innerJoin('market.categories', 'category')
          .andWhere('category.id IN (:...categoryIds)', { categoryIds });
      }

      if (q) {
        query.andWhere('market.title ILIKE :searchText', {
          searchText: `%${q}%`,
        });
      }

      const marketIds = await query.getRawMany();
      return marketIds.map((market) => market.market_marketId);
    } catch (error) {
      console.error('Error in get all favourite market ids for user:', error);
      throw new InternalServerErrorException(
        'Error in get all favourite market ids for user',
      );
    }
  }
}
