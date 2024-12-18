import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  Scope,
} from '@nestjs/common';
import { program, SOLANA_DECIMALS } from 'src/constants';
import { CacheService } from '../shared/cache/cache.service';
import { getBettingAccounts, getSolPriceInUSD } from 'src/helpers/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { QueryStatisticDto } from './dto/query-statistic.dto';

@Injectable()
export class StatisticsService {
  constructor(
    private redisCacheService: CacheService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  private async getSOLPrice() {
    try {
      const cachedPrice = await this.redisCacheService.get('sol_price');

      if (cachedPrice) return cachedPrice as number;

      const priceInUSD = await getSolPriceInUSD();

      this.redisCacheService.set('sol_price', priceInUSD, {
        ttl: 60 * 10,
      } as any);

      return priceInUSD as number;
    } catch (error) {
      console.error('Error in get SOL prices:', error);
      throw new InternalServerErrorException('Error in get SOL prices');
    }
  }

  async getMostBettingLeaderboard() {
    try {
      const bettingAccounts = await getBettingAccounts();
      const groupByUser = bettingAccounts.reduce((acc, account) => {
        if (!acc[account.voter]) {
          acc[account.voter] = 0;
        }
        acc[account.voter] += account.tokens;
        return acc;
      }, {});

      const result = await Promise.all(
        Object.keys(groupByUser).map(async (key) => {
          const user = await this.userRepository.findOne({
            select: ['username', 'avatarUrl', 'walletAddress'],
            where: { walletAddress: key },
          });
          return {
            ...user,
            totalBetting: groupByUser[key],
          };
        }),
      );

      return result
        .filter((user) => user.totalBetting > 0)
        .sort((a, b) => b.totalBetting - a.totalBetting);
    } catch (error) {
      console.error('Error in get most betting leader board:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in get most betting leader board',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in get most betting leader board',
      );
    }
  }

  async getMostProfitLeaderboard() {
    return 'This action returns the most profit leaderboard';
  }

  async getMemberStatistics(query: QueryStatisticDto) {
    try {
      let groupByField = '';
      switch (query.by) {
        case 'd':
          groupByField =
            "CONCAT(EXTRACT(YEAR FROM user.joinedAt), '-', LPAD(EXTRACT(MONTH FROM user.joinedAt)::text, 2, '0'), '-', LPAD(EXTRACT(DAY FROM user.joinedAt)::text, 2, '0'))";
          break;
        case 'm':
          groupByField =
            "CONCAT(EXTRACT(YEAR FROM user.joinedAt), '-', LPAD(EXTRACT(MONTH FROM user.joinedAt)::text, 2, '0'))";
          break;
        case 'y':
          groupByField = 'EXTRACT(YEAR FROM user.joinedAt)';
          break;
        default:
          groupByField =
            "CONCAT(EXTRACT(YEAR FROM user.joinedAt), '-', LPAD(EXTRACT(MONTH FROM user.joinedAt)::text, 2, '0'), '-', LPAD(EXTRACT(DAY FROM user.joinedAt)::text, 2, '0'))";
      }

      return this.userRepository
        .createQueryBuilder('user')
        .select('COUNT(*)', 'totalMembers')
        .addSelect(groupByField, 'period')
        .groupBy(groupByField)
        .orderBy('period', 'ASC')
        .getRawMany();
    } catch (error) {
      console.error('Error in get member statistics:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in get member statistics',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in get member statistics',
      );
    }
  }

  async getTransactionStatistics(query: QueryStatisticDto) {
    try {
      const bettingAccounts = await getBettingAccounts();
      const result = {};

      bettingAccounts.forEach((account) => {
        let period = '';
        if (!query.by || query.by === 'd') {
          period = `${account.createTime.getFullYear()}-${String(account.createTime.getMonth() + 1).padStart(2, '0')}-${String(account.createTime.getDate()).padStart(2, '0')}`;
        } else if (query.by === 'm') {
          period = `${account.createTime.getFullYear()}-${String(account.createTime.getMonth() + 1).padStart(2, '0')}`;
        } else if (query.by === 'y') {
          period = `${account.createTime.getFullYear()}`;
        }

        result[period] = (result[period] || 0) + 1;
      });

      return Object.keys(result)
        .map((key) => ({
          period: key,
          totalTransactions: result[key],
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Error in get tracsaction statistics:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in get tracsaction statistics',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in get tracsaction statistics',
      );
    }
  }

  async getTransactionVolumeStatistics(query: QueryStatisticDto) {
    try {
      const bettingAccounts = await getBettingAccounts();
      const result = {};

      bettingAccounts.forEach((account) => {
        let period = '';
        if (!query.by || query.by === 'd') {
          period = `${account.createTime.getFullYear()}-${String(account.createTime.getMonth() + 1).padStart(2, '0')}-${String(account.createTime.getDate()).padStart(2, '0')}`;
        } else if (query.by === 'm') {
          period = `${account.createTime.getFullYear()}-${String(account.createTime.getMonth() + 1).padStart(2, '0')}`;
        } else if (query.by === 'y') {
          period = `${account.createTime.getFullYear()}`;
        }

        result[period] = account.tokens + (result[period] || 0);
      });

      return Object.keys(result)
        .map((key) => ({
          period: key,
          totalVolumes: result[key],
        }))
        .filter((item) => item.totalVolumes > 0)
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Error in get transaction volumes statistics:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in get transaction volumes statistics',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in get transaction volumes statistics',
      );
    }
  }
}
