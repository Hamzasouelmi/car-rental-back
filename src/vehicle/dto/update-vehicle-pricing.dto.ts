import { PartialType } from '@nestjs/swagger';
import { CreateVehiclePricingDto } from './create-vehicle-pricing.dto';

export class UpdateVehiclePricingDto extends PartialType(
  CreateVehiclePricingDto,
) {}
