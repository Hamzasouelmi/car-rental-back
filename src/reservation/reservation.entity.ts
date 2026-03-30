import { Vehicle } from '../vehicle/entities/vehicle.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  // ─── VEHICLE ─────────────────────────────────────────────────────────────────
  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ type: 'int' })
  vehicleId: number;

  // ─── DATES ───────────────────────────────────────────────────────────────────
  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  // ─── PRIX ────────────────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPriceTND: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPriceUSD: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPriceEUR: number;

  // ─── STATUS ──────────────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  // ─── GUEST INFO ──────────────────────────────────────────────────────────────
  @Column({ type: 'varchar' })
  guestFirstName: string;

  @Column({ type: 'varchar' })
  guestLastName: string;

  @Column({ type: 'varchar' })
  guestEmail: string;

  @Column({ type: 'varchar' })
  guestPhone: string;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  // ─── TIMESTAMPS ──────────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;
}
