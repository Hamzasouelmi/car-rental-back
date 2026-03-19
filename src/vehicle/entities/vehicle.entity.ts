import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { VehiclePricing } from './vehicle-pricing.entity';

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

export enum VehicleCategory {
  ECONOMY = 'economy',
  COMPACT = 'compact',
  SUV = 'suv',
  LUXURY = 'luxury',
  VAN = 'van',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  brand: string;

  @Column({ type: 'varchar' })
  model: string;

  @Column({ type: 'int' })
  year: number;

  // ─── PRIX ────────────────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePricePerDayTND: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePricePerDayUSD: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePricePerDayEUR: number;

  @Column({ type: 'int' })
  seats: number;

  @Column({
    type: 'enum',
    enum: TransmissionType,
    default: TransmissionType.MANUAL,
  })
  transmission: TransmissionType;

  @Column({
    type: 'enum',
    enum: FuelType,
    default: FuelType.PETROL,
  })
  fuelType: FuelType;

  @Column({
    type: 'enum',
    enum: VehicleCategory,
    default: VehicleCategory.ECONOMY,
  })
  category: VehicleCategory;

  @Column({ type: 'int', default: 0 })
  mileage: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @OneToMany(() => VehiclePricing, (pricing) => pricing.vehicle, {
    cascade: true,
  })
  pricings: VehiclePricing[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
