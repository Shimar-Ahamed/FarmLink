import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

export class UpdateListingDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantityKg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePerKg?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @IsIn(["ACTIVE", "SOLD", "EXPIRED"])
  status?: string;
}