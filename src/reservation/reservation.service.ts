import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { VehicleService } from '../vehicle/vehicle.service';
import { EmailAuthService } from '../email-auth/email-auth.service';
import { Reservation, ReservationStatus } from './reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly vehicleService: VehicleService,
    private readonly emailAuthService: EmailAuthService,
  ) {}

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

    // vérifie si une réservation existe déjà pour cette période
    const existingReservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.vehicleId = :vehicleId', { vehicleId })
      .andWhere('reservation.status NOT IN (:...statuses)', {
        statuses: [ReservationStatus.CANCELLED],
      })
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
    // 4. créer la réservation
    const reservation = this.reservationRepository.create({
      ...dto,
      totalPriceTND,
      totalPriceUSD,
      totalPriceEUR,
      status: ReservationStatus.PENDING,
    });

    const saved = await this.reservationRepository.save(reservation);

    // 5. recharger avec les relations 👈
    const savedWithRelations = await this.findOne(saved.id);

    // 6. envoyer email de confirmation
    await this.emailAuthService.sendReservationConfirmation(
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

  async updateStatus(
    id: number,
    dto: UpdateReservationStatusDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.status = dto.status;
    return this.reservationRepository.save(reservation);
  }

  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
  }
}
