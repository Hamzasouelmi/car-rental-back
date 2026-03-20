import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from './shared/config/database.config';
import { User } from './users/user/user.entity';
import { Vehicle } from './vehicle/entities/vehicle.entity';
import { VehiclePricing } from './vehicle/entities/vehicle-pricing.entity';
import { Payment } from './payment/payment.entity';
import { Reservation } from './reservation/reservation.entity';

export const connectionSource = new DataSource({
  ...(databaseConfig as DataSourceOptions),
  entities: [User, Vehicle, VehiclePricing, Reservation, Payment],
  migrations: ['src/migrations/*.ts'],
});
