import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ListingStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateListingDto } from "./dto/create-listing.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFarmerListings(userId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new NotFoundException("Farmer profile not found");
    }

    return this.prisma.listing.findMany({
      where: {
        farmerId: farmer.id,
      },
      include: {
        vegetable: true,
        location: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getFarmerListingById(userId: string, listingId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new NotFoundException("Farmer profile not found");
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        farmerId: farmer.id,
      },
      include: {
        vegetable: true,
        location: true,
      },
    });

    if (!listing) {
      throw new NotFoundException("Listing not found");
    }

    return listing;
  }

  async getActiveListings() {
    return this.prisma.listing.findMany({
      where: {
        status: ListingStatus.ACTIVE,
      },
      include: {
        vegetable: true,
        location: true,
        farmer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async createListing(userId: string, dto: CreateListingDto) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new NotFoundException("Farmer profile not found");
    }

    const vegetable = await this.prisma.vegetable.findUnique({
      where: { id: dto.vegetableId },
    });

    if (!vegetable) {
      throw new NotFoundException("Vegetable not found");
    }

    if (dto.quantityKg <= 0) {
      throw new BadRequestException("Quantity must be greater than 0");
    }

    if (dto.pricePerKg <= 0) {
      throw new BadRequestException("Price must be greater than 0");
    }

    return this.prisma.listing.create({
      data: {
        farmerId: farmer.id,
        vegetableId: dto.vegetableId,
        quantityKg: dto.quantityKg,
        pricePerKg: dto.pricePerKg,
        notes: dto.notes || null,
        locationId: farmer.locationId,
      },
      include: {
        vegetable: true,
        location: true,
      },
    });
  }

  async updateListing(userId: string, listingId: string, dto: UpdateListingDto) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new NotFoundException("Farmer profile not found");
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.farmerId !== farmer.id) {
      throw new NotFoundException("Listing not found");
    }

    if (dto.quantityKg !== undefined && dto.quantityKg <= 0) {
      throw new BadRequestException("Quantity must be greater than 0");
    }

    if (dto.pricePerKg !== undefined && dto.pricePerKg <= 0) {
      throw new BadRequestException("Price must be greater than 0");
    }

    return this.prisma.listing.update({
      where: { id: listingId },
      data: {
        quantityKg: dto.quantityKg,
        pricePerKg: dto.pricePerKg,
        notes: dto.notes ?? null,
        status: dto.status as ListingStatus | undefined,
      },
      include: {
        vegetable: true,
        location: true,
      },
    });
  }

  async deleteListing(userId: string, listingId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new NotFoundException("Farmer profile not found");
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.farmerId !== farmer.id) {
      throw new NotFoundException("Listing not found");
    }

    return this.prisma.listing.delete({
      where: { id: listingId },
    });
  }
}