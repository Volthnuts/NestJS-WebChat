import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('privateChatNotifies')
export class PrivateNotifyEntity {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        senderID: number;

    @Column()
        receiverID: number;

    @Column()
        message: string;

    @CreateDateColumn()
        createdAt: Date;

    @UpdateDateColumn()
        updatedAt: Date;
}