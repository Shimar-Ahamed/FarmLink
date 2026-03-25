import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateFarmerProfileDto } from "./dto/update-farmer-profile.dto";

@Injectable()
export class FarmerService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      include: {
        location: true,
        user: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException("Farmer profile not found");
    }

    return farmer;
  }

  async updateMyProfile(userId: string, dto: UpdateFarmerProfileDto) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      include: {
        location: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException("Farmer profile not found");
    }

    let locationId = farmer.locationId;

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

    return this.prisma.farmerProfile.update({
      where: { userId },
      data: {
        fullName: dto.fullName,
        whatsapp: dto.whatsapp || null,
        address: dto.address || null,
        bio: dto.bio || null,
        locationId,
      },
      include: {
        location: true,
        user: true,
      },
    });
  }
}