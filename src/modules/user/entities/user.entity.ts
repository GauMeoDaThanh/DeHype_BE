import { Exclude } from 'class-transformer';
import { Blog } from 'src/modules/blog/entities/blog.entity';
import { MarketComment } from 'src/modules/market-comment/entities/market-comment.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  walletAddress: string;

  @Exclude()
  @Column({ default: 'user' })
  role: string;

  @Column()
  username: string;

  @Column({
    default:
      'https://res.cloudinary.com/diwacy6yr/image/upload/v1728441530/User/default.png',
  })
  avatarUrl: string;

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

  @OneToMany(() => MarketComment, (marketComment) => marketComment.user)
  marketComments: MarketComment[];

  @OneToMany(() => Blog, (blog) => blog.user)
  blogs: Blog[];
}
