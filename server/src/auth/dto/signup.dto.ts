import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { UserRole } from "@prisma/client";

export class SignupDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}