import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MarketComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  comment: string;

  @ManyToOne(() => User, (user) => user.marketComments)
  @JoinColumn({ name: 'walletAddress' })
  user: User;

  @Column()
  marketId: string;

  @ManyToOne(() => MarketComment, (parentComment) => parentComment.replies, {
    nullable: true,
  })
  parentComment: MarketComment;

  @OneToMany(() => MarketComment, (comment) => comment.parentComment)
  replies: MarketComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
