import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne, OneToMany } from "typeorm";
import { Post } from "./Post";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;
    
    @Column({ unique: true })
    username!: string;

    @Column()
    displayName!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    bio!: string;

    @Column({ nullable: true })
    profilePicture!: string;

    @OneToOne(() => User, { nullable: true })
    @JoinColumn()
    partner!: User | null;

    @OneToMany(() => Post, post => post.user)
    posts!: Post[];
}