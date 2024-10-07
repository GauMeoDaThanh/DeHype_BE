// solana.config.ts
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import idl from 'src/artifact/dehype.json';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create Solana connection
export const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');

// Set up anchor provider
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

