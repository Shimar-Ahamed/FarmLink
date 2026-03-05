import { Controller, Get, Query } from '@nestjs/common';
import { ForecastsService } from './forecasts.service';

@Controller('api/forecasts')
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  // ✅ NEW: Metadata endpoint
  @Get('meta')
  getMeta() {
    return this.forecastsService.getAllRegionsAndCommodities();
  }

  // ✅ Forecast endpoint
  @Get()
  getForecast(
    @Query('region') region: string,
    @Query('commodity') commodity: string,
  ) {
    return this.forecastsService.getForecast(region, commodity);
  }
}