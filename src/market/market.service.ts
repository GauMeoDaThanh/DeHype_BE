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
import idl from '../artifact/dehype.json';
@Injectable()
export class MarketService {
  private connection: Connection;
  private program: Program;

  constructor() {
    // Initialize Solana connection and program (replace with your program ID)
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    anchor.setProvider(anchor.AnchorProvider.env());

    this.program = new Program(idl as Idl, new PublicKey('GqroybDr5ep6GHJnk9XpmL6aamr7GRAsBQtSoy7SJwRV'));
  }

  async createMarket(eventName: string, outcomeOptions: string[], userKeypair: Keypair): Promise<PublicKey> {
    try {
      // Create a new market account
      const marketAccount = Keypair.generate();

      // Prepare the instruction data for creating a market
      await this.program.methods.createMarket(eventName, outcomeOptions)
        .accounts({
          market: marketAccount.publicKey,
          user: userKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([marketAccount, userKeypair])
        .rpc();

      // Send and confirm the transaction
      return marketAccount.publicKey; // Return the created market's public key
    } catch (error) {
      console.error('Error creating market:', error);
      throw new InternalServerErrorException('Failed to create market');
    }
  }

  async resolveMarket(marketAddress: PublicKey, winningOutcome: string, userKeypair: Keypair): Promise<void> {
    try {
      // Call the resolve market instruction
      await this.program.methods.resolveMarket(winningOutcome)
        .accounts({
          market: marketAddress,
          user: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();
      // Send and confirm the transaction
    } catch (error) {
      console.error('Error resolving market:', error);
      throw new InternalServerErrorException('Failed to resolve market');
    }
  }
}