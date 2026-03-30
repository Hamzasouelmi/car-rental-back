import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsString,
  Min,
} from 'class-validator';

export class BulkPricingDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsNumber()
  @Min(0)
  pricePerDayTND: number;

  @IsNumber()
  @Min(0)
  pricePerDayUSD: number;

  @IsNumber()
  @Min(0)
  pricePerDayEUR: number;

  // optionnel — si vide → tous les véhicules
  @IsArray()
  @IsOptional()
  vehicleIds?: number[];
}

export class UpdateBulkPricingDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerDayTND?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerDayUSD?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerDayEUR?: number;

  // optionnel — si vide → tous les véhicules
  @IsArray()
  @IsOptional()
  vehicleIds?: number[];
}
