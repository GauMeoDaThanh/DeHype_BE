import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import idl from 'src/artifact/dehype.json';
import * as dotenv from 'dotenv';
import { Idl, Program } from '@project-serum/anchor';

// Load environment variables from .env file
dotenv.config();

// Create Solana connection
export const connection = new Connection(
  process.env.SOLANA_RPC_URL!, // Make sure your .env file contains the SOLANA_RPC_URL key
  'confirmed',
);

// Set up anchor provider
const provider = new anchor.AnchorProvider(
  connection,
  anchor.Wallet.local(), // Assuming local wallet is used
  { preflightCommitment: 'confirmed' }
);
anchor.setProvider(provider);

// Set up anchor program
export const program = new Program(
  idl as Idl,
  new PublicKey('7fKSTrQLMk4K8svWTZ6dpD7mFVVfQdZ2TUb9MfqfAUWK'),
  provider
);