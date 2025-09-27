import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'parentOrgId' })
  parent?: Organization;

  @Column({ nullable: true })
  parentOrgId?: number | null;
}
