import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class BlockUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.blockUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletAddress' })
  user: User;

  @Column()
  blockReason: string;

  @CreateDateColumn()
  blockedAt: Date;
}
