import { Entity, PrimaryGeneratedColumn, Column, Timestamp, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn()
        id:number;
    @Column()
        username:string;
    @Column({ unique: true })
        email:string;
    @Column()
        password:string;
    @Column({ nullable: true })
        profileImage:string;
    @CreateDateColumn()
        createdAt: Date;
    @UpdateDateColumn()
        updatedAt: Date;
}