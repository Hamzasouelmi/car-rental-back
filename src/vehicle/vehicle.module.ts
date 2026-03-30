import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclePricing } from './entities/vehicle-pricing.entity';
import { Reservation } from 'src/reservation/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehiclePricing, Reservation])],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
