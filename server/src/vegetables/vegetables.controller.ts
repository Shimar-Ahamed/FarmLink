import { Controller, Get } from "@nestjs/common";
import { VegetablesService } from "./vegetables.service";

@Controller("vegetables")
export class VegetablesController {
  constructor(private readonly vegetablesService: VegetablesService) {}

  @Get()
  getAllVegetables() {
    return this.vegetablesService.getAllVegetables();
  }
}