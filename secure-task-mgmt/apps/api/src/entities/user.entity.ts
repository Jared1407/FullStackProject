import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './org.entity';
import { Role } from '@data/lib/enums';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'text' })
  role: Role;

  @ManyToOne(() => Organization, { eager: true })
  @JoinColumn({ name: 'orgId' })
  org: Organization;

  @Column()
  orgId: number;
}
