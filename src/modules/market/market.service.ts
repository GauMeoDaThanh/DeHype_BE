import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
  ResolveMarketDto,
} from './dto/create-market.dto';
import {
  AnswerAccount,
  MarketAccount,
  MarketResponse,
} from './dto/response-market.dto';
import { connection, program, SOLANA_DECIMALS } from 'src/constants';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { BN } from '@coral-xyz/anchor';
import { InjectRepository } from '@nestjs/typeorm';
import { Market } from './entities/market.entity';
import { Repository } from 'typeorm';
import { CacheService } from '../shared/cache/cache.service';

@Injectable()
export class MarketService {
  constructor(
    @InjectRepository(Market)
    private marketRepository: Repository<Market>,
    private redisCacheService: CacheService,
  ) {
    // Log the RPC URL and the connection to the cluster
    console.log('Connected to cluster:', connection.rpcEndpoint); // Logs the RPC endpoint
  }

  async getMarkets() {
    try {
      // const { trending, category } = getMarketsDto;

      const marketInfo = await this.marketRepository.find();
      const responses =
        (await program.account.marketAccount.all()) as MarketResponse[];

      const marketsStats = await Promise.all(
        responses.map(async (response) => {
          const { publicKey, account } = response;
          // const marketStats = await this.marketStats(publicKey);
          const market = marketInfo.find(
            (market) => market.marketId === publicKey.toString(),
          );

          return {
            publicKey,
            ...account,
            // marketStats,
            view: market.view,
            like: market.like_count,
          };
        }),
      );

      return marketsStats;
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

      return { ...marketAccount };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `failed to fetch info in market ${marketPublicKey}`,
      );
    }
  }

  async getBatchMarketStats(marketIds: string[]) {
    try {
      const uniqueIds = [...new Set(marketIds)];
      const results: { [key: string]: any } = {};

      // First check cache for existing stats
      const cachedResults = await Promise.all(
        uniqueIds.map(async (marketId) => {
          const cached = await this.redisCacheService.get(
            `${marketId}/marketstats`
          );
          return { marketId, cached };
        })
      );

      // Separate IDs that need fetching from cache hits
      const cachedIds = new Set(
        cachedResults
          .filter(({ cached }) => cached)
          .map(({ marketId }) => marketId)
      );

      // Add cached results to response
      cachedResults.forEach(({ marketId, cached }) => {
        if (cached) {
          results[marketId] = cached;
        }
      });

      // Fetch remaining markets in batches
      const remainingIds = uniqueIds.filter(id => !cachedIds.has(id));
      const batchSize = 5;

      for (let i = 0; i < remainingIds.length; i += batchSize) {
        const batch = remainingIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (marketId) => {
          try {
            const stats = await this.marketStats(new PublicKey(marketId));
            return { marketId, stats };
          } catch (error) {
            console.error(`Error fetching stats for market ${marketId}:`, error);
            return {
              marketId,
              error: 'Failed to fetch market stats'
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
              { ttl: 60 * 10 } as any // 10 minutes TTL
            );
          }
        });
      }

      // Format response to match frontend expectations
      return uniqueIds.map(marketId => ({
        marketId: new PublicKey(marketId),
        participants: results[marketId]?.participants || 0,
        totalVolume: results[marketId]?.totalVolume || 0,
        answerStats: results[marketId]?.answerStats || []
      }));

    } catch (error) {
      console.error('Error in batch market stats:', error);
      throw new InternalServerErrorException('Failed to fetch batch market stats');
    }
  }

  async marketStats(marketPublicKey: PublicKey) {
    try {
      let marketStats = await this.redisCacheService.get(
        `${marketPublicKey}/marketstats`,
      );
      if (marketStats) return marketStats;

      const marketAccount = (await program.account.marketAccount.fetch(
        marketPublicKey,
      )) as MarketAccount;
      const voters = await program.account.bettingAccount.all();
      const votersInMarket = voters.filter((voter) => {
        return voter.account.marketKey.eq(marketAccount.marketKey);
      });

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
          totalTokens: answer.answerTotalTokens,
          totalVolume: totalVolume.toNumber() / SOLANA_DECIMALS,
          percentage: displayPercentage,
        };
      });

      marketStats = {
        publicKey: marketPublicKey,
        participants: votersInMarket.length,
        totalVolume: totalVolume.toNumber() / SOLANA_DECIMALS,
        answerStats,
      }
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

  async votersInMarket(marketPublicKey: PublicKey) {
    try {
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

      const result = votersInMarket.map((voter) => {
        voter.account.createTime = new Date(
          voter.account.createTime.toNumber() * 1000,
        ).toUTCString();
        voter.account.tokens =
          voter.account.tokens.toNumber() / SOLANA_DECIMALS;
        const answerName = answerAccount.answers.find((ans) =>
          ans.answerKey.eq(voter.account.answerKey),
        );
        voter.account.answerKey = answerName.name;
        return voter;
      });

      return result;
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
    const { marketPublicKey } = createMarketDto;

    const marketInfo = this.marketRepository.create({
      marketId: marketPublicKey,
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
}
