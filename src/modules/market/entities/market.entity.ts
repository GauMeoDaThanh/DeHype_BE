import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Market {
  @PrimaryColumn()
  marketId: string;

  @Column('int4', { default: 0 })
  view: number;
}
