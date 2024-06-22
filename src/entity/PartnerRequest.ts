import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class PartnerRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.sentPartnerRequests)
    requester!: User;

    @ManyToOne(() => User, user => user.receivedPartnerRequests)
    requestee!: User;
}