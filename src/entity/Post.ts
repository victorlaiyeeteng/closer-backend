import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    image!: string;

    @Column()
    title!: string;

    @Column({ nullable: true })
    caption!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    timestamp!: Date;

    @ManyToOne(() => User, user => user.posts)
    user!: User;
}