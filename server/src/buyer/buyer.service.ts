import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateBuyerProfileDto } from "./dto/update-buyer-profile.dto";

@Injectable()
export class BuyerService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const buyer = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      include: {
        location: true,
        user: true,
      },
    });

    if (!buyer) {
      throw new NotFoundException("Buyer profile not found");
    }

    return buyer;
  }

  async updateMyProfile(userId: string, dto: UpdateBuyerProfileDto) {
    const buyer = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      include: {
        location: true,
      },
    });

    if (!buyer) {
      throw new NotFoundException("Buyer profile not found");
    }

    let locationId = buyer.locationId;

    if (dto.province && dto.district) {
      const normalizedCity = dto.city?.trim() ? dto.city.trim() : null;

      const existingLocation = await this.prisma.location.findFirst({
        where: {
          province: dto.province,
          district: dto.district,
          city: normalizedCity,
        },
      });

      if (existingLocation) {
        locationId = existingLocation.id;
      } else {
        const newLocation = await this.prisma.location.create({
          data: {
            province: dto.province,
            district: dto.district,
            city: normalizedCity,
          },
        });

        locationId = newLocation.id;
      }
    }

    return this.prisma.buyerProfile.update({
      where: { userId },
      data: {
        businessName: dto.businessName,
        ownerName: dto.ownerName || null,
        buyerType: dto.buyerType || null,
        whatsapp: dto.whatsapp || null,
        address: dto.address || null,
        locationId,
      },
      include: {
        location: true,
        user: true,
      },
    });
  }
}