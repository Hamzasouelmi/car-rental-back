import { IsDateString, IsOptional } from 'class-validator';

/**
 * A DTO base object.
 */
export class BaseDTO {
  id?: number;

  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}
