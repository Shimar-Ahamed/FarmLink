import { Module } from '@nestjs/common';
import { ForecastsService } from './forecasts.service';
import { ForecastsController } from './forecasts.controller';

@Module({
  providers: [ForecastsService],
  controllers: [ForecastsController]
})
export class ForecastsModule {}
