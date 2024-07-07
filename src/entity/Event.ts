import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;
    
    @Column({ nullable: true })
    description!: string;

    @Column({ type: 'timestamptz' })
    datetime!: Date;

    @Column()
    color!: string;

    @ManyToOne(() => User, user => user.events)
    user!: User;
}
