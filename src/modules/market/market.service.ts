import * as anchor from "@coral-xyz/anchor";
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { Program, Provider } from '@project-serum/anchor';
import { Idl } from '@project-serum/anchor'; // Import IDL type
// import { Market } from './models/market.model'; // Define your market model for type safety
import * as fs from 'fs'; // Import fs module
import idl from '../../artifact/dehype.json';
import { CreateMarketDto, ResolveMarketDto } from "./dto/create-market.dto";
import { connection } from "src/constants";
@Injectable()
export class MarketService {
  private connection: Connection;
  private program: Program;

  constructor() {
    // Initialize Solana connection and program (replace with your program ID)
    this.connection = connection;
    anchor.setProvider(anchor.AnchorProvider.env());

    this.program = new Program(idl as Idl, new PublicKey('GqroybDr5ep6GHJnk9XpmL6aamr7GRAsBQtSoy7SJwRV'));
  }

  async createMarketTransaction(createMarketDto: CreateMarketDto): Promise<{ transaction: string }> {
    try {
      const { eventName, outcomeOptions, userPublicKey } = createMarketDto;
      const marketAccount = Keypair.generate();

      const { blockhash } = await this.connection.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(userPublicKey);

      const instruction = await this.program.methods.createMarket(eventName, outcomeOptions)
        .accounts({
          market: marketAccount.publicKey,
          user: new PublicKey(userPublicKey),
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      transaction.add(instruction);

      return {
        transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64')
      };
    } catch (error) {
      console.error('Error creating market transaction:', error);
      throw new InternalServerErrorException('Failed to create market transaction');
    }
  }

  async resolveMarket(resolveMarketDto: ResolveMarketDto): Promise<string> {
    const { marketAddress, winningOutcome, userPublicKey } = resolveMarketDto;
    try {
      // Call the resolve market instruction
      const transaction = new Transaction().add(
        await this.program.methods.resolveMarket(winningOutcome)
          .accounts({
            market: new PublicKey(marketAddress),
            user: new PublicKey(userPublicKey),
          })
          .instruction()
      );

      return transaction.serialize({ requireAllSignatures: false }).toString('base64');
      // Send and confirm the transaction
    } catch (error) {
      console.error('Error resolving market:', error);
      throw new InternalServerErrorException('Failed to resolve market');
    }
  }
}