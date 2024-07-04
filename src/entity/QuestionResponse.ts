import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./Question";
import { User } from "./User";


@Entity()
export class QuestionResponse {
    @PrimaryGeneratedColumn()
    id !: number;

    @ManyToOne(() => User)
    user!: User;

    @ManyToOne(() => Question)
    question!: Question;

    @Column()
    response!: string;

}