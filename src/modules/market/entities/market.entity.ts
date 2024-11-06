import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Market {
  @PrimaryColumn()
  marketId: string;

  @Column()
  coverUrl: string;

  @Column('int4', { default: 0 })
  view: number;

  @Column({ default: 0 })
  like_count: number;

  @CreateDateColumn()
  createdAt: Date;
}
