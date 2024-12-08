import { IsOptional, IsNotEmpty, MinLength, Matches } from "class-validator";
import { UserLoginDto } from "./user-login.dto";
import { PrimaryGeneratedColumn, CreateDateColumn, Timestamp } from "typeorm";

export class UserRegisterDto extends UserLoginDto{
    @PrimaryGeneratedColumn()
        id:number;

    @IsNotEmpty({ message: "Please enter your username" })
    @MinLength( 6,{ message: "Username must be at least 6 charactors" })
        username: string;

    @IsOptional()
    @Matches(/\.(jpg|jpeg|png|pdf)$/, { message: "Profile image must be png,jpg pr pdf" })
        profileImage: string;
} 