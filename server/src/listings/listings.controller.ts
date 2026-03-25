import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateListingDto } from "./dto/create-listing.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";

@Controller("listings")
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get("active")
  getActiveListings() {
    return this.listingsService.getActiveListings();
  }

  @UseGuards(JwtAuthGuard)
  @Get("my")
  getMyListings(@Req() req: any) {
    return this.listingsService.getFarmerListings(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my/:id")
  getMyListingById(@Req() req: any, @Param("id") id: string) {
    return this.listingsService.getFarmerListingById(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createListing(@Req() req: any, @Body() dto: CreateListingDto) {
    return this.listingsService.createListing(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  updateListing(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateListingDto
  ) {
    return this.listingsService.updateListing(req.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  deleteListing(@Req() req: any, @Param("id") id: string) {
    return this.listingsService.deleteListing(req.user.sub, id);
  }
}