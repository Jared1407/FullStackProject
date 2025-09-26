import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './org.entity';
import { TaskStatus } from '@data/lib/enums';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'text', default: TaskStatus.TODO })
  status: TaskStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: number;

  @ManyToOne(() => Organization, { eager: true })
  @JoinColumn({ name: 'orgId' })
  org: Organization;

  @Column()
  orgId: number;
}
