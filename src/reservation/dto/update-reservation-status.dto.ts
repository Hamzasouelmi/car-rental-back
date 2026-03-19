import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReservationStatus } from '../reservation.entity';

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;
}
