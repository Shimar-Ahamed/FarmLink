import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  vegetableId: string;

  @IsNumber()
  @IsPositive()
  quantityKg: number;

  @IsNumber()
  @IsPositive()
  pricePerKg: number;

  @IsOptional()
  @IsString()
  notes?: string;
}