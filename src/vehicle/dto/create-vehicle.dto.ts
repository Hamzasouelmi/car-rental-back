import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Min,
} from 'class-validator';
import {
  FuelType,
  TransmissionType,
  VehicleCategory,
} from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsNumber()
  @Min(0)
  pricePerDayTND: number;

  @IsNumber()
  @Min(0)
  pricePerDayUSD: number;

  @IsNumber()
  @Min(0)
  pricePerDayEUR: number;

  @IsInt()
  @Min(1)
  seats: number;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsEnum(VehicleCategory)
  category: VehicleCategory;

  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}
