import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService
    ) { }

    async signup(dto: SignupDto) {
        const existing = await this.prisma.user.findUnique({
            where: { mobile: dto.mobile },
        });

        if (existing) {
            throw new BadRequestException("Mobile already registered");
        }

        const hash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                role: dto.role,
                mobile: dto.mobile,
                passwordHash: hash,
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

        const valid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!valid) {
            throw new BadRequestException("Invalid credentials");
        }

        return this.generateToken(user.id, user.role);
    }

    private generateToken(userId: string, role: string) {
        const payload = { sub: userId, role };

        return {
            access_token: this.jwt.sign(payload),
        };
    }
}