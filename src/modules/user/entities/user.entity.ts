import { Exclude } from 'class-transformer';
import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  walletAddress: string;

  @Exclude()
  @Column({ default: 'user' })
  role: string;

  @Column()
  username: string;

  @Column({ default: 0 })
  joinedMarkets: number;

  @Column({ default: 0 })
  profitLoss: number;

  @Column({ default: 0 })
  totalAmount: number;

  @BeforeInsert()
  setUsername() {
    this.username = this.walletAddress;
  }
}
