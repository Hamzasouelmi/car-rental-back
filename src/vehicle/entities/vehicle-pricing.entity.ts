import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_pricings')
export class VehiclePricing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  // ─── PRIX ────────────────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerDayTND: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerDayUSD: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerDayEUR: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.pricings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ type: 'int' })
  vehicleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
