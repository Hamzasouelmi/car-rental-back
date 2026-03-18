import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateVehiclePricingDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsNumber()
  @Min(0)
  pricePerDay: number;
}
