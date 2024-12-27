import { Market } from 'src/modules/market/entities/market.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  coverUrl: string;

  @ManyToMany(() => Market, (market) => market.categories, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'market_category',
  })
  markets: Market[];
}
