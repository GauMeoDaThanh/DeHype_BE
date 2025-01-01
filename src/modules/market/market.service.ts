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
  CreateMarketTransactionDto,
  CreateMarketDto,
  GetVoterHistoryQueryDto,
  ResolveMarketDto,
  GetMarketSummaryDto,
} from './dto/create-market.dto';
import {
  AnswerAccount,
  BettingAccountResponse,
  MarketAccount,
  MarketResponse,
} from './dto/response-market.dto';
import { connection, program, SOLANA_DECIMALS } from 'src/constants';
import { BN, Coder, EventParser } from '@coral-xyz/anchor';
import { InjectRepository } from '@nestjs/typeorm';
import { Market } from './entities/market.entity';
import { ILike, In, Like, Repository } from 'typeorm';
import { CacheService } from '../shared/cache/cache.service';
import { CategoryService } from '../category/category.service';
import { UserService } from '../user/user.service';
import { interval, Observable, switchMap } from 'rxjs';
import { MarketStatsDto } from './dto/market-detail.dto';
import { MarketOptionStats } from './entities/market-option-stats.entity';
import { response, Response } from 'express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { getSolPriceInUSD } from 'src/helpers/utils';
import { UpdateMarketCategoryDto } from './dto/update-market.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { BorshCoder } from '@project-serum/anchor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import textVersion from 'textversionjs';
import axios from 'axios';

interface BetEventData {
  voter: PublicKey;
  marketKey: BN;
  answerKey: BN;
  amount: BN;
  marketPublicKey: PublicKey;
  timestamp: BN;
  bettingAccountKey: PublicKey;
}

interface CreateEventData {
  voter: PublicKey;
  marketKey: BN;
  title: string;
  coverUrl: string;
  description: string;
  createorFeePercentage: BN;
  startTime: BN;
  endTime: BN;
}

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
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
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

      const eventParser = new EventParser(
        program.programId,
        new BorshCoder(program.idl) as unknown as Coder<string, string>,
      );
      const events = eventParser.parseLogs(transaction.meta.logMessages);
      for (let event of events) {
        if (event.name === 'BetEvent') {
          this.handleBettingEvent(event.data);
          break;
        } else if (event.name === 'CreateMarketEvent') {
          this.handleCreateMarketEvent(event.data);
          break ;
        } else if (event.name === 'MarketResolvedEvent') {
          this.handleMarketResolvedEvent(event.data);
          break;
        }
      }
    });
  }
  private async handleMarketResolvedEvent(eventData: any) {
    const marketAccount = await program.account.marketAccount.fetch(
      eventData.marketPubkey.toString(),
    );
    const voters = (await program.account.bettingAccount.all())
      .filter((voter) => voter.account.marketKey.eq(marketAccount.marketKey))
      .map((voter) => voter.account.voter.toString());
    const uniqueVoters = [...new Set(voters)];
    // check if voter is in database. If not, remove it from list
    const users = await this.userService.getUserByWalletAddress(uniqueVoters);
    await this.notificationsService.createEndMarketNotifications(
      users,
      marketAccount.title.toString(),
      eventData.answerName.toString(),
    );
    console.log('create notification for market resolved');
  }

  private async handleCreateMarketEvent(eventData: any) {
    await this.createMarket({
      marketPublicKey: eventData.marketPubkey.toString(),
      marketKey: eventData.marketKey.toString(16),
      coverUrl: eventData.coverUrl,
      title: eventData.title.toString(),
      categoryIds: [],
    });
    console.log('Market created');
  }

  private async handleBettingEvent(eventData: BetEventData) {
    const marketPublicKey = eventData.marketPublicKey.toString();
    console.log(marketPublicKey);
    const updatedMarketStats = await this.calculateMarketStats(marketPublicKey);
    this.updateMarketOptionStatsAndReturnNumberOfOptions(marketPublicKey, {
      publicKey: marketPublicKey,
      answerStats: updatedMarketStats.answerStats,
    });
    await this.redisCacheService.set(
      `${marketPublicKey}/marketstats`,
      updatedMarketStats,
      { ttl: 60 * 10 } as any,
    );
    console.log('Market stats updated in Redis');
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

          const startTime = new Date(account.startTime.toNumber() * 1000);
          const endTime = new Date(account.endTime.toNumber() * 1000);

          const votersInMarket = voters.filter((voter) => {
            const marketKey = new BN(voter.account.marketKey, 16);
            return marketKey.eq(account.marketKey);
          });

          const { startTime: _, ...restAccount } = account;

          return {
            publicKey,
            ...restAccount,
            createdAt: startTime,
            endTime,
            totalRewards: restAccount.totalRewards.toNumber() / SOLANA_DECIMALS,
            totalWinner: restAccount.totalWinner.toNumber(),
            view: market ? market.view : 0,
            like: market ? market.like_count : 0,
            totalVolume: account.marketTotalTokens.toNumber() / SOLANA_DECIMALS,
            participants: votersInMarket.length,
          };
        }),
      );

      // Return according to trending
      return marketsStats.sort((a, b): number => {
        return (
          (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) ||
          b.participants - a.participants ||
          b.totalVolume - a.totalVolume ||
          b.like - a.like ||
          b.view - a.view ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    } catch (error) {
      console.error('Error in get all markets:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in get all markets',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in get all markets',
      );
    }
  }
  async getMarket(marketPublicKey: string) {
    try {
      const marketAccount = (await program.account.marketAccount.fetch(
        marketPublicKey,
      )) as MarketAccount;

      const marketInfo = await this.marketRepository.findOne({
        where: { marketId: marketPublicKey },
        relations: ['categories'],
      });

      const startTime = new Date(marketAccount.startTime.toNumber() * 1000);
      const endTime = new Date(marketAccount.endTime.toNumber() * 1000);
      const voters = (await this.getAllVoters()) as BettingAccountResponse[];

      const votersInMarket = voters.filter((voter) => {
        const marketKey = new BN(voter.account.marketKey, 16);
        return marketKey.eq(marketAccount.marketKey);
      });

      const { startTime: _, ...restAccount } = marketAccount;

      return {
        publicKey: marketPublicKey,
        ...restAccount,
        view: marketInfo.view,
        like: marketInfo.like_count,
        createdAt: startTime,
        totalRewards: restAccount.totalRewards.toNumber() / SOLANA_DECIMALS,
        totalWinner: restAccount.totalWinner.toNumber(),
        endTime,
        totalVolume:
          marketAccount.marketTotalTokens.toNumber() / SOLANA_DECIMALS,
        participants: votersInMarket.length,
        categories: marketInfo.categories ? marketInfo.categories : [],
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

        const startTime = new Date(account.startTime.toNumber() * 1000);
        const endTime = new Date(account.endTime.toNumber() * 1000);

        const votersInMarket = voters.filter((voter) => {
          const marketKey = new BN(voter.account.marketKey, 16);
          return marketKey.eq(account.marketKey);
        });

        const { startTime: _, ...restAccount } = account;

        return {
          publicKey,
          ...restAccount,
          createAt: startTime,
          endTime,
          totalRewards: restAccount.totalRewards.toNumber() / SOLANA_DECIMALS,
          totalWinner: restAccount.totalWinner.toNumber(),
          view: market.view,
          like: market.like_count,
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
        key: answer.answerKey,
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
          voter.account.answerName = answerName.name;
          return {
            publicKey: voter.publicKey,
            username: voterInfo ? voterInfo.username : voter.publicKey,
            avatarUrl: voterInfo
              ? voterInfo.avatarUrl
              : 'https://res.cloudinary.com/diwacy6yr/image/upload/v1728441530/User/default.png',
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

  async uploadMarketCover(coverUrl: Express.Multer.File) {
    try {
      const folder = 'market';
      const uploadResult = await this.cloudinaryService.uploadFile(
        coverUrl,
        folder,
      );

      return {
        public_id: uploadResult.public_id,
        url: uploadResult.url,
      };
    } catch (error) {
      console.error('Error in upload market cover to cloudinary:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in upload market cover to cloudinary',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in upload market cover to cloudinary',
      );
    }
  }

  async createMarket(createMarketDto: CreateMarketDto) {
    try {
      const { marketPublicKey, categoryIds, title, marketKey, coverUrl } =
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
        coverUrl,
        categories,
        title,
      });
      return await this.marketRepository.save(marketInfo);
    } catch (error) {
      console.error('Error in add market to database:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in add market to database',
          error.message,
        );
      }
      throw new InternalServerErrorException('Error in add market to database');
    }
  }

  async updateMarketCategories(
    marketPublicKey: string,
    updateMarketCategoryDto: UpdateMarketCategoryDto,
  ) {
    try {
      const { categoryIds } = updateMarketCategoryDto;
      const marketInfo = await this.marketRepository.findOne({
        where: { marketId: marketPublicKey },
        relations: ['categories'],
      });
      if (!marketInfo)
        throw new NotFoundException(
          `Fail to fetch market with id ${marketPublicKey}`,
        );
      const newCategories =
        await this.categoryService.findCategoriesByIds(categoryIds);
      marketInfo.categories = newCategories;
      return await this.marketRepository.save(marketInfo);
    } catch (error) {
      console.error('Error in update market categories:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in update market categories',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in update market categories',
      );
    }
  }

  async resolveMarket(
    marketAddress: string,
    resolveMarketDto: ResolveMarketDto,
  ) {
    const { winningOutcome, userPublicKey } = resolveMarketDto;
    try {
      // const transaction = new Transaction().add(
      //   await program.methods
      //     .resolveMarket(winningOutcome)
      //     .accounts({
      //       market: new PublicKey(marketAddress),
      //       user: new PublicKey(userPublicKey),
      //     })
      //     .instruction(),
      // );
      // return transaction
      //   .serialize({ requireAllSignatures: false })
      //   .toString('base64');
      const marketAccount =
        await program.account.marketAccount.fetch(marketAddress);
      const voters = (await program.account.bettingAccount.all())
        .filter((voter) => voter.account.marketKey.eq(marketAccount.marketKey))
        .map((voter) => voter.account.voter.toString());
      const uniqueVoters = [...new Set(voters)];
      // check if voter is in database. If not, remove it from list
      const users = await this.userService.getUserByWalletAddress(uniqueVoters);

      this.notificationsService.createEndMarketNotifications(
        users,
        marketAccount.title.toString(),
        winningOutcome,
      );
      return 'OK';
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

  async updateMarketOptionStatsAndReturnNumberOfOptions(
    marketPublicKey: string,
    marketStat: MarketStatsDto = null,
  ) {
    try {
      await this.createPartitionIfNotExist(marketPublicKey);
      let stats = marketStat;
      if (!stats) {
        stats = (await this.marketStats(
          marketPublicKey,
          false,
        )) as MarketStatsDto;
      }
      const simplifiedData = stats.answerStats.map((stat) => ({
        name: stat.name,
        percentage: stat.percentage,
      }));
      let time = new Date();
      await Promise.all(
        simplifiedData.map(async (stat) => {
          const marketOptionStat = this.marketOptionsStatsRepository.create({
            market: { marketId: marketPublicKey.toString() },
            name: stat.name,
            percentage: stat.percentage,
            timestamp: time,
          });
          await this.marketOptionsStatsRepository.save(marketOptionStat);
        }),
      );
      return simplifiedData.length;
    } catch (error) {
      console.error('Error in update market options stats:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in update market options stats',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in update market options stats',
      );
    }
  }

  async handleMarketOptionStats(
    marketPubKey: PublicKey | string,
    isFirstTimeConnect = false,
  ) {
    try {
      console.log('dang lay data');
      let marketOptionStats = [];
      if (isFirstTimeConnect) {
        const isExistOptionStatsOfMarket =
          await this.marketOptionsStatsRepository.exists({
            where: { market: { marketId: marketPubKey.toString() } },
          });
        if (!isExistOptionStatsOfMarket) {
          const numberOfOptions =
            await this.updateMarketOptionStatsAndReturnNumberOfOptions(
              marketPubKey.toString(),
            );
          this.redisCacheService.set(
            `${marketPubKey}/updateStats`,
            numberOfOptions,
            {
              ttl: 0,
            } as any,
          );
        }
        marketOptionStats = await this.marketOptionsStatsRepository.find({
          where: { market: { marketId: marketPubKey.toString() } },
          select: ['name', 'percentage', 'timestamp', 'marketId'],
          order: { timestamp: 'DESC', name: 'DESC' },
          take: 200,
        });
      } else {
        const marketDataCount = await this.marketOptionsStatsRepository.count({
          where: { market: { marketId: marketPubKey.toString() } },
        });
        const marketDataCountFromRedis: number =
          await this.redisCacheService.get(`${marketPubKey}/updateStats`);
        if (marketDataCount > marketDataCountFromRedis) {
          const latestTimestamp = (
            await this.marketOptionsStatsRepository.findOne({
              where: { market: { marketId: marketPubKey.toString() } },
              order: { timestamp: 'DESC' },
              select: ['marketId', 'name', 'percentage', 'timestamp'],
            })
          ).timestamp;
          marketOptionStats = await this.marketOptionsStatsRepository.find({
            where: {
              market: { marketId: marketPubKey.toString() },
              timestamp: latestTimestamp,
            },
            select: ['name', 'percentage', 'timestamp'],
            order: { timestamp: 'DESC', name: 'DESC' },
          });
          this.redisCacheService.set(
            `${marketPubKey}/updateStats`,
            marketDataCount,
            { ttl: 0 } as any,
          );
        }
      }
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

  async marketSummary(marketSummaryDto: GetMarketSummaryDto) {
    const data = await this.redisCacheService.get(
      `${marketSummaryDto.title}/summary`,
    );
    if (data) return data;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

    //create search keywords
    const currentDate = `${
      new Date().getMonth() + 1
    }/${new Date().getFullYear()}`;
    const { title, description } = marketSummaryDto;
    const n = 3;
    const userPrompt = `I'm writing a research report on ${title} and its description: ${description} and need help coming up with diverse search queries.
    Please generate a list of ${n} search queries that would be useful for writing a research report on ${title}. These queries can be in various formats, from simple keywords to more complex phrases. Do not add any formatting or numbering to the queries. If the topic refers to time, right now is ${currentDate}. If talking about the future, it is 2025 and beyond.`;

    let model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction:
        'The user will ask you to help generate some search queries. Respond with only the suggested queries in plain text with no extra formatting, each on its own line.',
    });
    const result = (await model.generateContent(userPrompt)).response
      .text()
      .split('\n')
      .filter((s) => s.trim().length > 0)
      .slice(0, n);

    // searching
    const headers = {
      'X-API-Key': process.env.YOU_AI_SEARCH_API,
    };

    let results: any[] = [];
    for (const query of result) {
      const url = `https://api.ydc-index.io/search?query=${query}`;
      const response = await axios.get(url, {
        headers,
      });
      results.push(await response.data);
      break;
    }

    results = results.map((result) =>
      result.hits.map((hit: any) => hit.snippets),
    );

    //synthesizing content
    const contentSlice = 750;
    const inputData = results
      .map((result) => result.slice(0, contentSlice))
      .join(',');
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'text/plain',
    };
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
    const chatSession = model.startChat({ generationConfig, history: [] });
    const summary = await chatSession.sendMessage(
      `Input data: ${inputData} write a short paragraph summary of the research report about ${title} based on the provided information. Just short paragraph! about 8-10 sentences long. No need to say "based on the provided information". Don't give your opinion, just summarize the information.`,
    );

    return summary.response.text().replace(/\. {2,}/g, '. ');
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
