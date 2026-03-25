import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ForecastsModule } from './forecasts/forecasts.module';
import { ListingsModule } from './listings/listings.module';
import { VegetablesModule } from './vegetables/vegetables.module';
import { FarmerModule } from './farmer/farmer.module';
import { BuyerModule } from './buyer/buyer.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ForecastsModule,
    ListingsModule,
    VegetablesModule,
    FarmerModule,
    BuyerModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
