import { PrimaryGeneratedColumn } from "typeorm"
import { IsNotEmpty, IsNumber, IsString, IsOptional } from "class-validator"

export class GroupChatDto {
    @IsOptional()
    senderID: number;

    @IsOptional()
    @IsNumber()
    receiverID: number;

    @IsOptional()
    status: string;

    @IsOptional()
    @IsString()
    method: string;

    @IsOptional()
    @IsNumber()
    friendID: number;
}