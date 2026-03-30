import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { VehicleService } from '../vehicle/vehicle.service';
import { EmailAuthService } from '../email-auth/email-auth.service';
import { Reservation, ReservationStatus } from './reservation.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger('ReservationService');

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly vehicleService: VehicleService,
    private readonly emailAuthService: EmailAuthService,
    private readonly paymentService: PaymentService,
  ) {}
  // ─── AUTO CANCEL PENDING RESERVATIONS ────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async cancelExpiredReservations(): Promise<void> {
    const expiredReservations = await this.reservationRepository.find({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
    });

    if (expiredReservations.length === 0) return;

    for (const reservation of expiredReservations) {
      reservation.status = ReservationStatus.CANCELLED;
      await this.reservationRepository.save(reservation);
      this.logger.log(
        `Reservation #${reservation.id} auto-cancelled (expired)`,
      );
    }
  }
  // ─── PUBLIC ───────────────────────────────────────────────────────────────────

  async checkAvailability(
    vehicleId: number,
    startDate: string,
    endDate: string,
  ): Promise<{ isAvailable: boolean }> {
    const vehicle = await this.vehicleService.findOne(vehicleId);

    if (!vehicle.isAvailable) {
      return { isAvailable: false };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }
    // Vérifie les réservations CONFIRMED et PENDING non expirées
    const existingReservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.vehicleId = :vehicleId', { vehicleId })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
      })
      .andWhere(
        '(reservation.expiresAt IS NULL OR reservation.expiresAt > :now)',
        { now: new Date() },
      )
      .andWhere(
        'reservation.startDate <= :endDate AND reservation.endDate >= :startDate',
        { startDate, endDate },
      )
      .getOne();

    return { isAvailable: !existingReservation };
  }

  async create(dto: CreateReservationDto): Promise<Reservation> {
    // 1. vérifier la disponibilité
    const { isAvailable } = await this.checkAvailability(
      dto.vehicleId,
      dto.startDate,
      dto.endDate,
    );

    if (!isAvailable) {
      throw new BadRequestException('Vehicle is not available for this period');
    }

    // 2. vérifier les dates
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // 3. calculer le prix
    const totalPriceTND = await this.vehicleService.calculatePrice(
      dto.vehicleId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      'TND',
    );

    const totalPriceUSD = await this.vehicleService.calculatePrice(
      dto.vehicleId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      'USD',
    );

    const totalPriceEUR = await this.vehicleService.calculatePrice(
      dto.vehicleId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      'EUR',
    );

    // 4. calculer expiresAt → 30 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    // 5. créer la réservation
    const reservation = this.reservationRepository.create({
      ...dto,
      totalPriceTND,
      totalPriceUSD,
      totalPriceEUR,
      status: ReservationStatus.PENDING,
      expiresAt,
    });

    const saved = await this.reservationRepository.save(reservation);
    const savedWithRelations = await this.findOne(saved.id);

    // 6. envoyer email
    await this.emailAuthService.sendReservationCreated(
      dto.guestEmail,
      savedWithRelations,
    );

    return savedWithRelations;
  }
  // ─── ADMIN ────────────────────────────────────────────────────────────────────

  async findAll(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });
    if (!reservation)
      throw new NotFoundException(`Reservation #${id} not found`);
    return reservation;
  }

  async update(id: number, dto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, dto);
    return this.reservationRepository.save(reservation);
  }

  /* async updateStatus(
    id: number,
    dto: UpdateReservationStatusDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.status = dto.status;
    return this.reservationRepository.save(reservation);
  }*/

  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
  }
  async createReservationByAdmin(
    dto: CreateReservationDto & { status?: ReservationStatus },
  ): Promise<Reservation> {
    // 1. vérifier la disponibilité
    const { isAvailable } = await this.checkAvailability(
      dto.vehicleId,
      dto.startDate,
      dto.endDate,
    );

    if (!isAvailable) {
      throw new BadRequestException('Vehicle is not available for this period');
    }

    // 2. vérifier les dates
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // 3. calculer les prix
    const totalPriceTND = await this.vehicleService.calculatePrice(
      dto.vehicleId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      'TND',
    );

    const totalPriceUSD = await this.vehicleService.calculatePrice(
      dto.vehicleId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      'USD',
    );

    const totalPriceEUR = await this.vehicleService.calculatePrice(
      dto.vehicleId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      'EUR',
    );

    // 4. définir le statut et expiresAt
    const status =
      dto.status === ReservationStatus.CONFIRMED
        ? ReservationStatus.CONFIRMED
        : ReservationStatus.PENDING;

    const expiresAt =
      status === ReservationStatus.PENDING
        ? new Date(Date.now() + 30 * 60 * 1000)
        : null;

    // 5. créer la réservation
    const reservation = this.reservationRepository.create({
      ...dto,
      totalPriceTND,
      totalPriceUSD,
      totalPriceEUR,
      status,
      expiresAt,
    });

    const saved = await this.reservationRepository.save(reservation);
    const savedWithRelations = await this.findOne(saved.id);

    // 6. si la réservation est CONFIRMED → créer paiement PAID
    if (saved.status === ReservationStatus.CONFIRMED) {
      await this.paymentService.createAdminPaidPayment(saved);
    }

    // 7. envoyer email
    await this.emailAuthService.sendReservationCreated(
      dto.guestEmail,
      savedWithRelations,
    );

    return savedWithRelations;
  }
  async updateStatus(
    id: number,
    dto: UpdateReservationStatusDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    const previousStatus = reservation.status;

    reservation.status = dto.status;
    const updated = await this.reservationRepository.save(reservation);

    // Si on passe à CONFIRMED et qu'il n'y a pas de paiement PAID → en créer un
    if (
      dto.status === ReservationStatus.CONFIRMED &&
      previousStatus !== ReservationStatus.CONFIRMED
    ) {
      await this.paymentService.createAdminPaidPayment(updated);
    }

    return updated;
  }
}
