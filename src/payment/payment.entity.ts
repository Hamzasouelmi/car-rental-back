import { Reservation } from '../reservation/reservation.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  // ─── RESERVATION ─────────────────────────────────────────────────────────────
  @ManyToOne(() => Reservation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @Column({ type: 'int' })
  reservationId: number;

  // ─── MONTANT ─────────────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountTND: number;

  // ─── STATUS ──────────────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // ─── KONNECT ─────────────────────────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  paymentRef: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentUrl: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  // ─── TIMESTAMPS ──────────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
