import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Market } from './market.entity';

@Entity()
export class MarketOptionStats {
  @PrimaryColumn()
  marketId: string;

  @ManyToOne(() => Market)
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @PrimaryColumn()
  name: string;

  @Column()
  percentage: string;

  @PrimaryColumn()
  timestamp: Date;
}
