import { Market } from 'src/modules/market/entities/market.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class FavMarket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.favMarkets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletAddress' })
  user: User;

  @ManyToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketPubKey' })
  market: Market;
}
