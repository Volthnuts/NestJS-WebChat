import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class UserLoginDto {
    @IsNotEmpty({ message: "Please enter your email" })
    @IsEmail({}, { message: "Your email is invalid" })
        email: string;

    @IsNotEmpty({ message: "Please enter your password" })
    @MinLength( 8,{ message: "Password must be at least 8 charactors" })
        password: string;
} 