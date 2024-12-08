import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from "class-validator"

export class PrivateChatDto {

    @IsNotEmpty()
    @Transform(({ value }) => Number(value))
    @IsNumber()
    receiverID: number;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsString()
    message?: string;
}