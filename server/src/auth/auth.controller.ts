import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SignupBuyerDto } from "./dto/signup-buyer.dto";
import { SignupFarmerDto } from "./dto/signup-farmer.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup/farmer")
  signupFarmer(@Body() dto: SignupFarmerDto) {
    return this.authService.signupFarmer(dto);
  }

  @Post("signup/buyer")
  signupBuyer(@Body() dto: SignupBuyerDto) {
    return this.authService.signupBuyer(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  
}