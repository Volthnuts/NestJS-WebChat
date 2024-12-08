import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('privateChats')
export class PrivateChatEntity {
    @PrimaryGeneratedColumn()
        id: number;
    @Column()
        senderID: number;
    @Column()
        receiverID: number;
    @Column({ nullable: true })
        message: string;
    @Column({ nullable: true })
        image: string;
    @Column({ default: false })
        seen: boolean;
    @CreateDateColumn()
        createdAt: Date;
    @UpdateDateColumn()
        updatedAt: Date;
}