import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('groupChatNotifies')
export class GroupNotifyEntity {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        groupName: string;

    @Column()
        senderID: number;

    @Column()
        message: string;

    @CreateDateColumn()
        createdAt: Date;

    @UpdateDateColumn()
        updatedAt: Date;
}
