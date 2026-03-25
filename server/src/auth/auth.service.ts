import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole, Location } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { SignupBuyerDto } from "./dto/signup-buyer.dto";
import { SignupFarmerDto } from "./dto/signup-farmer.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  private async findOrCreateLocation(
    province: string,
    district: string,
    city?: string
  ): Promise<Location> {
    const normalizedCity = city?.trim() ? city.trim() : null;

    const existing = await this.prisma.location.findFirst({
      where: {
        province,
        district,
        city: normalizedCity,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.location.create({
      data: {
        province,
        district,
        city: normalizedCity,
      },
    });
  }

  async signupFarmer(dto: SignupFarmerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { mobile: dto.mobile },
    });

    if (existing) {
      throw new BadRequestException("Mobile already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const location = await this.findOrCreateLocation(
      dto.province,
      dto.district,
      dto.city
    );

    const user = await this.prisma.user.create({
      data: {
        role: UserRole.FARMER,
        mobile: dto.mobile,
        passwordHash,
        farmerProfile: {
          create: {
            fullName: dto.fullName,
            whatsapp: dto.whatsapp,
            bio: dto.bio,
            address: dto.address,
            locationId: location.id,
          },
        },
      },
    });

    return this.generateToken(user.id, user.role);
  }

  async signupBuyer(dto: SignupBuyerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { mobile: dto.mobile },
    });

    if (existing) {
      throw new BadRequestException("Mobile already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let locationId: string | undefined = undefined;

    if (dto.province && dto.district) {
      const location = await this.findOrCreateLocation(
        dto.province,
        dto.district,
        dto.city
      );

      locationId = location.id;
    }

    const user = await this.prisma.user.create({
      data: {
        role: UserRole.BUYER,
        mobile: dto.mobile,
        passwordHash,
        buyerProfile: {
          create: {
            businessName: dto.businessName,
            ownerName: dto.ownerName,
            buyerType: dto.buyerType,
            whatsapp: dto.whatsapp,
            address: dto.address,
            locationId,
          },
        },
      },
    });

    return this.generateToken(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { mobile: dto.mobile },
    });

    if (!user) {
      throw new BadRequestException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new BadRequestException("Invalid credentials");
    }

    return this.generateToken(user.id, user.role);
  }

  private generateToken(userId: string, role: string) {
    const payload = { sub: userId, role };

    return {
      access_token: this.jwt.sign(payload),
      role,
    };
  }
}