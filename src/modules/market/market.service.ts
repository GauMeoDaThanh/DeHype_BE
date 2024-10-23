import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { CreateMarketDto, ResolveMarketDto } from './dto/create-market.dto';
import { MarketAccount, MarketResponse } from './dto/response-market.dto';
import { connection, program } from 'src/constants';

@Injectable()
export class MarketService {
  constructor() {
    // Log the RPC URL and the connection to the cluster
    console.log('Connected to cluster:', connection.rpcEndpoint); // Logs the RPC endpoint
  }

  async getMarkets() {
    try {
      const responses =
        (await program.account.marketAccount.all()) as MarketResponse[];

      return responses.map((response) => {
        const { publicKey, account } = response;
        return {
          publicKey,
          ...account,
        };
      }); // Add the closing parenthesis for map here and close the return
    } catch (error) {
      throw error;
    }
  }


  async getMarket(marketPublicKey: PublicKey) {
    try {
      const marketAccount = (await program.account.marketAccount.fetch(
        marketPublicKey,
      )) as MarketAccount;

      console.log({ marketAccount });
    } catch (error) {
      throw error;
    }
  }

  async createMarketTransaction(
    createMarketDto: CreateMarketDto,
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
}
