import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  reservationId: number;
}
