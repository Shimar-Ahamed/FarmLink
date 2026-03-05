import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ForecastsService implements OnModuleInit {
  private forecastsData: any;

  onModuleInit() {
    this.loadForecasts();
  }

  private loadForecasts() {
    try {
      const filePath = path.join(
        process.cwd(),
        'src',
        'data',
        'forecasts_2026_weekly_xgb_fastxai.json',
      );

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      this.forecastsData = JSON.parse(fileContent);

      console.log('✅ XGBoost AI Forecast Data Loaded Successfully');
    } catch (error: any) {
      console.error('⚠️ Error loading forecast JSON:', error.message);
      this.forecastsData = { pairs: [] };
    }
  }

  // ✅ NEW: Get all regions & commodities dynamically
  getAllRegionsAndCommodities() {
    if (!this.forecastsData?.pairs) {
      return { regions: [], commodities: [] };
    }

    const regions = [
      ...new Set(this.forecastsData.pairs.map((p: any) => p.region)),
    ];

    const commodities = [
      ...new Set(this.forecastsData.pairs.map((p: any) => p.commodity)),
    ];

    return { regions, commodities };
  }

  // ✅ UPDATED: Include test_metrics + model info
  getForecast(region: string, commodity: string) {
    if (!region || !commodity) {
      throw new NotFoundException(
        'Please provide both region and commodity.',
      );
    }

    const result = this.forecastsData.pairs.find(
      (pair: any) =>
        pair.region.toLowerCase() === region.toLowerCase() &&
        pair.commodity.toLowerCase() === commodity.toLowerCase(),
    );

    if (!result) {
      throw new NotFoundException(
        `No AI forecast found for ${commodity} in ${region}.`,
      );
    }

    return {
      region: result.region,
      commodity: result.commodity,
      forecast: result.forecast,
      test_metrics: this.forecastsData.test_metrics,
      model: this.forecastsData.model,
      resolution: this.forecastsData.resolution,
      generated_at: this.forecastsData.generated_at,
    };
  }
}