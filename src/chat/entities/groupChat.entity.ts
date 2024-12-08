import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('friends')
export class FriendsEntity {
    @PrimaryGeneratedColumn()
        id: number;
    @Column()
        senderID: number;
    @Column()
        receiverID: number;
    @Column()
        status: string;
    @CreateDateColumn()
        createdAt: Date;
    @UpdateDateColumn()
        updatedAt: Date;
}