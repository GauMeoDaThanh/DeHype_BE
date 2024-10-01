import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class PendingUser {
  @PrimaryColumn()
  walletAddress: string;

  @Column()
  isLedger: boolean;

  @Column()
  nonce: string;
}
