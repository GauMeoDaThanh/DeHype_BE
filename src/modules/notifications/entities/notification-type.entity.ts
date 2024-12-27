import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class NotificationType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;
}
