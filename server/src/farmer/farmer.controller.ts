import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FarmerService } from "./farmer.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateFarmerProfileDto } from "./dto/update-farmer-profile.dto";

@Controller("farmer")
export class FarmerController {
  constructor(private readonly farmerService: FarmerService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMyProfile(@Req() req: any) {
    return this.farmerService.getMyProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMyProfile(
    @Req() req: any,
    @Body() dto: UpdateFarmerProfileDto
  ) {
    return this.farmerService.updateMyProfile(req.user.sub, dto);
  }
}