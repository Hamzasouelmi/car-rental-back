import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  @Min(1)
  vehicleId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  guestFirstName: string;

  @IsString()
  @IsNotEmpty()
  guestLastName: string;

  @IsEmail()
  @IsNotEmpty()
  guestEmail: string;

  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
