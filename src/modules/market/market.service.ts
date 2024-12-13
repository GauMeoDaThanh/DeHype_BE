import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  CreateBetDto,
  CreateMarketDto,
  CreateMarketTransactionDto,
  GetVoterHistoryQueryDto,
  ResolveMarketDto,
} from './dto/create-market.dto';
import {
  AnswerAccount,
  BettingAccountResponse,
  MarketAccount,
  MarketResponse,
} from './dto/response-market.dto';
import {
  connection,
  program,
  SOLANA_DECIMALS,
  hermesConnection,
} from 'src/constants';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { BN } from '@coral-xyz/anchor';
import { InjectRepository } from '@nestjs/typeorm';
import { Market } from './entities/market.entity';
import { ILike, In, Like, Repository } from 'typeorm';
import { CacheService } from '../shared/cache/cache.service';
import { CategoryService } from '../category/category.service';
import { UserService } from '../user/user.service';
import { interval, Observable, switchMap } from 'rxjs';
import { MarketStatsDto } from './dto/market-detail.dto';
import { MarketOptionStats } from './entities/market-option-stats.entity';
import { Response } from 'express';
import { log, time } from 'console';

@Injectable()
export class MarketService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Market)
    private marketRepository: Repository<Market>,
    @InjectRepository(MarketOptionStats)
    private marketOptionsStatsRepository: Repository<MarketOptionStats>,
    private redisCacheService: CacheService,
    private categoryService: CategoryService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {
    // Log the RPC URL and the connection to the cluster
    console.log('Connected to cluster:', connection.rpcEndpoint); // Logs the RPC endpoint
  }

  onApplicationBootstrap() {
    this.initializeProgramListener();
  }

  async initializeProgramListener() {
    connection.onLogs(program.programId, async (logs, context) => {
      // find out the market public key from the logs
      const transaction = await connection.getParsedTransaction(
        logs.signature,
        {
          commitment: 'confirmed',
        },
      );
      if (transaction) {
        const marketPublicKeyInTransaction =
          transaction.transaction.message.accountKeys[4].pubkey.toBase58();

        // Because get market publickey is fixed, using this to check if that is the truth market public key
        const isMarketExist = await this.marketRepository.existsBy({
          marketId: marketPublicKeyInTransaction,
        });

        if (isMarketExist) {
          const updatedMarketStats = await this.calculateMarketStats(
            marketPublicKeyInTransaction,
          );
          await this.redisCacheService.set(
            `${marketPublicKeyInTransaction}/marketstats`,
            updatedMarketStats,
            { ttl: 60 * 10 } as any,
          );
          console.log('Market stats updated in Redis');
        }
      }
    });
  }

  async getMarkets() {
    try {
      // const { trending, category } = getMarketsDto;

      const marketInfo = await this.marketRepository.find();
      const responses =
        (await program.account.marketAccount.all()) as MarketResponse[];
      const voters = (await this.getAllVoters()) as BettingAccountResponse[];

      const marketsStats = await Promise.all(
        responses.map(async (response) => {
          const { publicKey, account } = response;

          const market = marketInfo.find(
            (market) => market.marketId === publicKey.toString(),
          );

          const votersInMarket = voters.filter((voter) => {
            const marketKey = new BN(voter.account.marketKey, 16);
            return marketKey.eq(account.marketKey);
          });

          return {
            publicKey,
            ...account,
            view: market.view,
            like: market.like_count,
            createdAt: market.createdAt,
            totalVolume: account.marketTotalTokens.toNumber() / SOLANA_DECIMALS,
            participants: votersInMarket.length,
          };
        }),
      );

      // return marketsStats;

      // Return according to trending
      return marketsStats.sort((a, b): number => {
        return (
          b.participants - a.participants ||
          b.totalVolume - a.totalVolume ||
          b.like - a.like ||
          b.view - a.view
        );
      });
    } catch (error) {
      console.error('Error fetching market stats:', error);
      throw new InternalServerErrorException('Failed to fetch market stats');
    }
  }
  async getMarket(marketPublicKey: string) {
    try {
      const marketAccount = (await program.account.marketAccount.fetch(
        marketPublicKey,
      )) as MarketAccount;

      const marketInfo = await this.marketRepository.findOne({
        where: { marketId: marketPublicKey },
      });

      const voters = (await this.getAllVoters()) as BettingAccountResponse[];

      const votersInMarket = voters.filter((voter) => {
        const marketKey = new BN(voter.account.marketKey, 16);
        return marketKey.eq(marketAccount.marketKey);
      });

      return {
        publicKey: marketPublicKey,
        ...marketAccount,
        view: marketInfo.view,
        like: marketInfo.like_count,
        createdAt: marketInfo.createdAt,
        totalVolume:
          marketAccount.marketTotalTokens.toNumber() / SOLANA_DECIMALS,
        participants: votersInMarket.length,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `failed to fetch info in market ${marketPublicKey}`,
      );
    }
  }

  async getBatchMarkets(publicKeys: string[]) {
    const fetchMarketFromProgram =
      (await program.account.marketAccount.fetchMultiple(
        publicKeys,
      )) as MarketAccount[];

    const responses: MarketResponse[] = fetchMarketFromProgram.map(
      (info, index) => ({
        publicKey: publicKeys[index],
        account: info,
      }),
    );

    const marketInfo = await this.marketRepository.find({
      where: { marketId: In(publicKeys) },
    });
    const voters = (await this.getAllVoters()) as BettingAccountResponse[];

    const batchMarketInfos = await Promise.all(
      responses.map(async (response) => {
        const { publicKey, account } = response;

        const market = marketInfo.find(
          (market) => market.marketId === publicKey.toString(),
        );

        const votersInMarket = voters.filter((voter) => {
          const marketKey = new BN(voter.account.marketKey, 16);
          return marketKey.eq(account.marketKey);
        });

        return {
          publicKey,
          ...account,
          view: market.view,
          like: market.like_count,
          createdAt: market.createdAt,
          totalVolume: account.marketTotalTokens.toNumber() / SOLANA_DECIMALS,
          participants: votersInMarket.length,
        };
      }),
    );
    return batchMarketInfos;
  }

  async getBatchMarketStats(marketIds: string[]) {
    try {
      const uniqueIds = [...new Set(marketIds)];
      const results: { [key: string]: any } = {};

      // First check cache for existing stats
      const cachedResults = await Promise.all(
        uniqueIds.map(async (marketId) => {
          const cached = await this.redisCacheService.get(
            `${marketId}/marketstats`,
          );
          return { marketId, cached };
        }),
      );

      // Separate IDs that need fetching from cache hits
      const cachedIds = new Set(
        cachedResults
          .filter(({ cached }) => cached)
          .map(({ marketId }) => marketId),
      );

      // Add cached results to response
      cachedResults.forEach(({ marketId, cached }) => {
        if (cached) {
          results[marketId] = cached;
        }
      });

      // Fetch remaining markets in batches
      const remainingIds = uniqueIds.filter((id) => !cachedIds.has(id));
      const batchSize = 5;

      for (let i = 0; i < remainingIds.length; i += batchSize) {
        const batch = remainingIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (marketId) => {
          try {
            const stats = await this.marketStats(new PublicKey(marketId));
            return { marketId, stats };
          } catch (error) {
            console.error(
              `Error fetching stats for market ${marketId}:`,
              error,
            );
            return {
              marketId,
              error: 'Failed to fetch market stats',
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        // Add batch results to final results
        batchResults.forEach(({ marketId, stats, error }) => {
          results[marketId] = error ? { error } : stats;

          // Cache successful results
          if (!error) {
            this.redisCacheService.set(
              `${marketId}/marketstats`,
              stats,
              { ttl: 60 * 10 } as any, // 10 minutes TTL
            );
          }
        });
      }

      // Format response to match frontend expectations
      return uniqueIds.map((marketId) => ({
        marketId,
        answerStats: results[marketId]?.answerStats || [],
      }));
    } catch (error) {
      console.error('Error in batch market stats:', error);
      throw new InternalServerErrorException(
        'Failed to fetch batch market stats',
      );
    }
  }

  async getAllVoters() {
    const allVoters = await this.redisCacheService.get('all_voters');
    if (allVoters) return allVoters;

    const fetchedVoters = await program.account.bettingAccount.all();
    this.redisCacheService.set('all_voters', fetchedVoters, {
      ttl: 60 * 5,
    } as any);
    return fetchedVoters;
  }

  async calculateMarketStats(marketPublicKey: PublicKey | string) {
    const marketAccount = (await program.account.marketAccount.fetch(
      marketPublicKey,
    )) as MarketAccount;

    const totalVolume = marketAccount.marketTotalTokens;
    const [answerPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('answer'),
        marketAccount.marketKey.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId,
    );
    const answerAccount = (await program.account.answerAccount.fetch(
      answerPDA,
    )) as unknown as AnswerAccount;

    const answerStats = answerAccount.answers.map((answer) => {
      const totalTokens = answer.answerTotalTokens.toNumber();
      const totalVolumeNum = totalVolume.toNumber();

      let percentage = 0;
      if (totalVolumeNum > 0) {
        percentage = (totalTokens / totalVolumeNum) * 100;
      }
      // Set a threshold for displaying small percentages
      const displayPercentage =
        percentage >= 1
          ? percentage.toFixed(2)
          : Math.floor(percentage).toString();

      return {
        name: answer.name,
        totalTokens: answer.answerTotalTokens.toNumber(),
        totalVolume: totalVolume.toNumber() / SOLANA_DECIMALS,
        percentage: displayPercentage,
      };
    });

    return {
      marketId: marketPublicKey,
      answerStats,
    };
  }

  async marketStats(marketPublicKey: PublicKey | string, isCache = true) {
    try {
      let marketStats = await this.redisCacheService.get(
        `${marketPublicKey}/marketstats`,
      );
      if (marketStats && isCache) return marketStats;

      marketStats = await this.calculateMarketStats(marketPublicKey);

      this.redisCacheService.set(
        `${marketPublicKey}/marketstats`,
        marketStats,
        { ttl: 60 * 10 } as any,
      );

      return marketStats;
    } catch (error) {
      console.error('Error:', error);
      throw new InternalServerErrorException(
        `failed to fetch stats in market ${marketPublicKey}`,
      );
    }
  }

  async getSOLPrice() {
    try {
      const cachedPrice = await this.redisCacheService.get('sol_price');

      if (cachedPrice) return cachedPrice as number;

      const pricesInfo = (
        await hermesConnection.getLatestPriceUpdates([
          '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
        ])
      ).parsed[0].price;

      const priceInUSD =
        Number(pricesInfo.price) /
        Math.pow(10, Math.abs(Number(pricesInfo.expo)));

      this.redisCacheService.set('sol_price', priceInUSD, {
        ttl: 60 * 10,
      } as any);

      return priceInUSD as number;
    } catch (error) {
      console.error('Error in get SOL prices:', error);
      throw new InternalServerErrorException('Error in get SOL prices');
    }
  }

  async votersInMarket(
    marketPublicKey: PublicKey,
    query: GetVoterHistoryQueryDto,
  ) {
    try {
      const { min } = query;
      const SOLPrice: number = await this.getSOLPrice();
      const marketAccount =
        await program.account.marketAccount.fetch(marketPublicKey);
      const voters = await program.account.bettingAccount.all();
      const [answerPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('answer'),
          marketAccount.marketKey.toArrayLike(Buffer, 'le', 8),
        ],
        program.programId,
      );
      const answerAccount = (await program.account.answerAccount.fetch(
        answerPDA,
      )) as unknown as AnswerAccount;
      const votersInMarket = voters.filter((voter) =>
        voter.account.marketKey.eq(marketAccount.marketKey),
      );
      // handle logic to fetch desired data
      const result = await Promise.all(
        votersInMarket.map(async (voter) => {
          const voterInfo = await this.userService.getUser(
            voter.account.voter.toString(),
          );
          voter.account.createTime = new Date(
            voter.account.createTime.toNumber() * 1000,
          ).toUTCString();
          voter.account.tokens =
            voter.account.tokens.toNumber() / SOLANA_DECIMALS;
          const answerName = answerAccount.answers.find((ans) =>
            ans.answerKey.eq(voter.account.answerKey),
          );
          voter.account.answerKey = answerName.name;
          return {
            publicKey: voter.publicKey,
            username: voterInfo.username,
            avatarUrl: voterInfo.avatarUrl,
            totalBet: (voter.account.tokens * SOLPrice).toFixed(2),
            account: voter.account,
          };
        }),
      );

      const sortedResult = result
        .filter((voter) => Number(voter.totalBet) >= Number(min || 0))
        .sort(
          (a, b) =>
            new Date(b.account.createTime).getTime() -
            new Date(a.account.createTime).getTime(),
        );

      return sortedResult;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `failed to fetch voters in market ${marketPublicKey}`,
      );
    }
  }

  async placeBet(createBetDto: CreateBetDto, voter: PublicKey) {
    const { marketKey, betAmount, answerKey } = createBetDto;

    try {
      const transaction = await program.methods
        .bet(answerKey, betAmount)
        .accounts({
          voter: voter,
          marketAccount: PublicKey.findProgramAddressSync(
            [Buffer.from('market'), marketKey.toArrayLike(Buffer, 'le', 8)],
            program.programId,
          )[0],
          vaultAccount: PublicKey.findProgramAddressSync(
            [
              Buffer.from('market_vault'),
              marketKey.toArrayLike(Buffer, 'le', 8),
            ],
            program.programId,
          )[0],
          answerAccount: PublicKey.findProgramAddressSync(
            [Buffer.from('answer'), marketKey.toArrayLike(Buffer, 'le', 8)],
            program.programId,
          )[0],
          betAccount: PublicKey.findProgramAddressSync(
            [
              Buffer.from('betting'),
              voter.toBuffer(),
              marketKey.toArrayLike(Buffer, 'le', 8),
              new BN(answerKey).toArrayLike(Buffer, 'le', 8),
            ],
            program.programId,
          )[0],
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = voter; //!!! voter != publickey ?

      return {
        transaction: transaction
          .serialize({ requireAllSignatures: false })
          .toString('base64'),
      };
    } catch (error) {
      console.error('Error in placeBet: ', error);
      throw error;
    }
  }

  async createMarketTransaction(
    createMarketDto: CreateMarketTransactionDto,
  ): Promise<{ transaction: string }> {
    try {
      const { eventName, outcomeOptions, userPublicKey } = createMarketDto;
      const marketAccount = Keypair.generate();

      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(userPublicKey);

      const instruction = await program.methods
        .createMarket(eventName, outcomeOptions)
        .accounts({
          market: marketAccount.publicKey,
          user: new PublicKey(userPublicKey),
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      transaction.add(instruction);

      return {
        transaction: transaction
          .serialize({ requireAllSignatures: false })
          .toString('base64'),
      };
    } catch (error) {
      console.error('Error creating market transaction:', error);
      throw new InternalServerErrorException(
        'Failed to create market transaction',
      );
    }
  }

  async createMarket(createMarketDto: CreateMarketDto) {
    const { marketPublicKey, coverUrl, categoryIds, title, marketKey } =
      createMarketDto;

    if (await this.marketRepository.existsBy({ marketId: marketPublicKey }))
      throw new BadRequestException(
        `Already have market with id ${marketPublicKey}`,
      );

    const categories =
      await this.categoryService.findCategoriesByIds(categoryIds);
    const marketInfo = this.marketRepository.create({
      marketId: marketPublicKey,
      marketKey,
      categories,
      coverUrl,
      title,
    });
    return await this.marketRepository.save(marketInfo);
  }

  async resolveMarket(resolveMarketDto: ResolveMarketDto): Promise<string> {
    const { marketAddress, winningOutcome, userPublicKey } = resolveMarketDto;
    try {
      const transaction = new Transaction().add(
        await program.methods
          .resolveMarket(winningOutcome)
          .accounts({
            market: new PublicKey(marketAddress),
            user: new PublicKey(userPublicKey),
          })
          .instruction(),
      );

      return transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64');
    } catch (error) {
      console.error('Error resolving market:', error);
      throw new InternalServerErrorException('Failed to resolve market');
    }
  }

  async updateMarketLike(marketPubKey: string, isLike: boolean = false) {
    const marketInfo = await this.marketRepository.findOne({
      where: { marketId: marketPubKey },
    });
    if (!marketInfo)
      throw new NotFoundException(
        `Fail to fetch market with id ${marketPubKey}`,
      );

    if (isLike) {
      marketInfo.like_count += 1;
    } else {
      marketInfo.like_count -= 1;
    }
    return await this.marketRepository.save(marketInfo);
  }

  addMarketView(marketPubKey: string) {
    this.marketRepository.update(marketPubKey, {
      view: () => 'view + 1',
    });
  }

  async findMarketIdsByCategory(categoryIds: number[], q?: string) {
    try {
      const query = this.marketRepository
        .createQueryBuilder('market')
        .select('market.marketId', 'marketId')
        .distinct(true)
        .innerJoin('market.categories', 'category')
        .where('category.id IN (:...categoryIds)', {
          categoryIds: categoryIds,
        });
      if (q) {
        query.andWhere('market.title ILIKE :searchText', {
          searchText: `%${q}%`,
        });
      }
      const marketIds = await query.getRawMany();
      return marketIds.map((market) => market.marketId);
    } catch (error) {
      console.error('Error in find market by category:', error);
      throw new InternalServerErrorException(
        'Error in find market by category',
      );
    }
  }

  async findMarketIdsByName(searchText: string) {
    try {
      const result = await this.marketRepository
        .createQueryBuilder('market')
        .select('market.marketId', 'marketId')
        .where('market.title ILIKE :searchText', {
          searchText: `%${searchText}%`,
        })
        .getRawMany();

      return result.map((row) => row.marketId);
    } catch (error) {
      console.error('Error in find market id by name:', error);
      throw new InternalServerErrorException('Error in find market id by name');
    }
  }

  async findMarketByName(searchText: string) {
    try {
      const result = await this.marketRepository.find({
        where: { title: ILike(`%${searchText}%`) },
        take: 5,
      });
      return result;
    } catch (error) {
      console.error('Error in find market by name:', error);
      throw new InternalServerErrorException('Error in find market by name');
    }
  }

  async createPartitionIfNotExist(marketPubKey: PublicKey | string) {
    try {
      const partitionName = `market_option_stats_${marketPubKey.toString()}`;
      const partitionExists =
        await this.marketOptionsStatsRepository.manager.query(
          `          SELECT EXISTS (
            SELECT 1
            FROM pg_inherits
            JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
            JOIN pg_class child ON pg_inherits.inhrelid = child.oid
            WHERE child.relname = '${partitionName}'
        );`,
        );
      if (!partitionExists[0].exists) {
        await this.marketOptionsStatsRepository.manager.query(
          `CREATE TABLE "${partitionName}" PARTITION OF "market_option_stats"
          FOR VALUES IN ('${marketPubKey}');`,
        );
      }
    } catch (error) {
      console.error('Error in check partition exists:', error);
      throw new InternalServerErrorException('Error in check partition exists');
    }
  }

  async handleMarketOptionStats(
    marketPubKey: PublicKey | string,
    isFirstTimeConnect = false,
  ) {
    try {
      await this.createPartitionIfNotExist(marketPubKey);
      const stats = (await this.marketStats(
        marketPubKey,
        false,
      )) as MarketStatsDto;
      const simplifiedData = stats.answerStats.map((stat) => ({
        name: stat.name,
        percentage: stat.percentage,
      }));

      console.log('dang lay data');
      const lastUpdateTimestamp = await this.redisCacheService.get(
        `${marketPubKey}/updateStats`,
      );
      const lastUpdateDate = new Date(
        await this.redisCacheService.get(`${marketPubKey}/updateStats`),
      );

      if (!lastUpdateTimestamp) {
        var time = new Date();
        await Promise.all(
          simplifiedData.map(async (stat) => {
            const marketOptionStat = this.marketOptionsStatsRepository.create({
              market: { marketId: marketPubKey.toString() },
              name: stat.name,
              percentage: stat.percentage,
              timestamp: time,
            });
            await this.marketOptionsStatsRepository.save(marketOptionStat);
          }),
        );
        this.redisCacheService.set(
          `${marketPubKey}/updateStats`,
          time,
          { ttl: 15 } as any, // 15 seconds TTL
        );
      }

      // Get data from database
      const marketOptionStats = !isFirstTimeConnect
        ? await this.marketOptionsStatsRepository.find({
            where: {
              timestamp: lastUpdateTimestamp
                ? lastUpdateDate
                : new Date(
                    await this.redisCacheService.get(
                      `${marketPubKey}/updateStats`,
                    ),
                  ),
              market: { marketId: marketPubKey.toString() },
            },
            select: ['name', 'percentage', 'timestamp'],
            order: { timestamp: 'ASC', name: 'DESC' },
          })
        : await this.marketOptionsStatsRepository.find({
            where: { market: { marketId: marketPubKey.toString() } },
            select: ['name', 'percentage', 'timestamp', 'marketId'],
            order: { timestamp: 'DESC', name: 'DESC' },
            take: 200,
          });
      // Format reponse data
      const groupedStats = marketOptionStats.reduce((acc, stat) => {
        const existingEntry = acc.find(
          (entry) => entry.timestamp === stat.timestamp.toISOString(),
        );

        if (!existingEntry) {
          acc.push({
            timestamp: stat.timestamp.toISOString(),
            data: [{ name: stat.name, percentage: stat.percentage }],
          });
        } else {
          existingEntry.data.push({
            name: stat.name,
            percentage: stat.percentage,
          });
        }

        return acc;
      }, []);
      return groupedStats;
    } catch (error) {
      console.error('Error in handle market options stats:', error);
      throw new InternalServerErrorException(
        'Error in handle market options stats',
      );
    }
  }

  async getMarketStatsUpdateByPolling(marketPubKey: string, isInit: boolean) {
    if (isInit) {
      return await this.handleMarketOptionStats(marketPubKey, true);
    } else {
      return await this.handleMarketOptionStats(marketPubKey);
    }
  }

  async getMarketLiveUpdate(marketPubKey: string, res: Response) {
    try {
      const initialStats = await this.handleMarketOptionStats(
        marketPubKey,
        true,
      );

      return new Observable((subscriber) => {
        subscriber.next({
          data: {
            marketPubKey,
            state: 'Initial data',
            stats: initialStats,
          },
        });
        const intervalSubscription = interval(1000 * 20 * 1)
          .pipe(
            switchMap(async () => {
              const stats = await this.handleMarketOptionStats(marketPubKey);
              return {
                data: {
                  marketPubKey,
                  state: 'Live update',
                  stats,
                },
              };
            }),
          )
          .subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err),
          });

        // Cleanup on unsubscribe
        return () => {
          console.log(
            `Unsubscribing from market live update for market ${marketPubKey}`,
          );
          intervalSubscription.unsubscribe();
        };
      });
    } catch (error) {
      console.error('Error in get market live update:', error);
      throw new InternalServerErrorException('Error in get market live update');
    }
  }

  async getUserBettingHistory(walletAddress: string) {
    try {
      const SOLPrice: number = await this.getSOLPrice();
      const allVoters = await program.account.bettingAccount.all();
      const currentVoter = allVoters.filter(
        (voter) => voter.account.voter.toString() === walletAddress,
      );

      const result = await Promise.all(
        currentVoter.map(async (voter) => {
          // Parse to UTC string
          voter.account.createTime = new Date(
            voter.account.createTime.toNumber() * 1000,
          ).toUTCString();

          // Parse tokens to human readable format
          voter.account.tokens =
            voter.account.tokens.toNumber() / SOLANA_DECIMALS;

          // Get answer name from answer account
          const [answerPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('answer'),
              voter.account.marketKey.toArrayLike(Buffer, 'le', 8),
            ],
            program.programId,
          );
          const answerAccount = (await program.account.answerAccount.fetch(
            answerPDA,
          )) as unknown as AnswerAccount;
          const answerName = answerAccount.answers.find((ans) =>
            ans.answerKey.eq(voter.account.answerKey),
          );

          // Get market infomation from market private key
          const market = await this.marketRepository.findOneBy({
            marketKey: voter.account.marketKey.toString(16),
          });

          voter.account.answerKey = answerName.name;
          return {
            marketPublicKey: market.marketId,
            marketTitle: market.title,
            marketCoverUrl: market.coverUrl,
            totalBet: (voter.account.tokens * SOLPrice).toFixed(2),
            tokens: voter.account.tokens,
            answerKey: voter.account.answerKey,
            createTime: new Date(voter.account.createTime),
          };
        }),
      );

      return result.sort(
        (a, b) => b.createTime.getTime() - a.createTime.getTime(),
      );
    } catch (error) {
      console.error('Error in get user betting history :', error);
      throw new InternalServerErrorException(
        'Error in get user betting history',
      );
    }
  }
}
