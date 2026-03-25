import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { BuyerService } from "./buyer.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateBuyerProfileDto } from "./dto/update-buyer-profile.dto";

@Controller("buyer")
export class BuyerController {
  constructor(private readonly buyerService: BuyerService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMyProfile(@Req() req: any) {
    return this.buyerService.getMyProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMyProfile(
    @Req() req: any,
    @Body() dto: UpdateBuyerProfileDto
  ) {
    return this.buyerService.updateMyProfile(req.user.sub, dto);
  }
}