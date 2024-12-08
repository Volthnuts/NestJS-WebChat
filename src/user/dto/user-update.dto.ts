import { UserRegisterDto } from "./user-register.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UserUpdateDto extends PartialType(UserRegisterDto) {}