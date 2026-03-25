import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VegetablesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllVegetables() {
    return this.prisma.vegetable.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}