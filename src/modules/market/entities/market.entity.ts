import { Category } from 'src/modules/category/entities/category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Market {
  @PrimaryColumn()
  marketId: string;

  @Column({ unique: true })
  marketPrivateKey: string;

  @Column()
  title: string;

  @Column()
  coverUrl: string;

  @Column('int4', { default: 0 })
  view: number;

  @Column({ default: 0 })
  like_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Category, (category) => category.markets)
  @JoinTable({
    name: 'market_category',
  })
  categories: Category[];
}
