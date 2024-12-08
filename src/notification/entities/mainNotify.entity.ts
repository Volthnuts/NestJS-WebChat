import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum NotifyType {
    PRIVATE = "private",
    GROUP = "group",
}

@Entity('notifies')
export class MainNotifyEntity {

    @PrimaryGeneratedColumn()
        id: number;
    @Column()
        notifyID: number;  
    @Column({
        type: "enum", // ประเภท enum
        enum: NotifyType,  // ลิงค์ไปที่ค่า enum
    })
        type: NotifyType; // ยอมรับเฉพาะค่า enum เท่านั้น
    @Column({ default: false })
        seen: boolean;
    @CreateDateColumn()
        createdAt: Date;
    @UpdateDateColumn()
        updatedAt: Date;
}
