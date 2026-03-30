import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclePricing } from './entities/vehicle-pricing.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CreateVehiclePricingDto } from './dto/create-vehicle-pricing.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateVehiclePricingDto } from './dto/update-vehicle-pricing.dto';
import {
  Reservation,
  ReservationStatus,
} from 'src/reservation/reservation.entity';
import { BulkPricingDto, UpdateBulkPricingDto } from './dto/bulk-pricing.dto';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehiclePricing)
    private readonly vehiclePricingRepository: Repository<VehiclePricing>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  // ─── VEHICLE CRUD ─────────────────────────────────────────────────────────────

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      relations: ['pricings'],
    });
  }
  async findAvailableVehicles(
    startDate: string,
    endDate: string,
  ): Promise<Vehicle[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    const vehicles = await this.vehicleRepository.find({
      where: { isAvailable: true },
      relations: ['pricings'],
    });

    const availableVehicles: Vehicle[] = [];

    for (const vehicle of vehicles) {
      const existingReservation = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.vehicleId = :vehicleId', {
          vehicleId: vehicle.id,
        })
        .andWhere('reservation.status IN (:...statuses)', {
          statuses: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
        })
        .andWhere(
          '(reservation.expiresAt IS NULL OR reservation.expiresAt > :now)',
          { now: new Date() },
        )
        .andWhere(
          'reservation.startDate <= :endDate AND reservation.endDate >= :startDate',
          { startDate: start, endDate: end },
        )
        .getOne();

      if (!existingReservation) {
        availableVehicles.push(vehicle);
      }
    }

    return availableVehicles;
  }

  async findAllAdmin(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      relations: ['pricings'],
    });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['pricings'],
    });
    if (!vehicle) throw new NotFoundException(`Vehicle #${id} not found`);
    return vehicle;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create(dto);
    return this.vehicleRepository.save(vehicle);
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.remove(vehicle);
  }

  async toggleAvailable(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.isAvailable = !vehicle.isAvailable;
    return this.vehicleRepository.save(vehicle);
  }

  // ─── VEHICLE PRICING CRUD ─────────────────────────────────────────────────────

  async findPricings(vehicleId: number): Promise<VehiclePricing[]> {
    await this.findOne(vehicleId); // vérifie que le véhicule existe
    return this.vehiclePricingRepository.find({
      where: { vehicleId },
    });
  }

  async createPricing(
    vehicleId: number,
    dto: CreateVehiclePricingDto,
  ): Promise<VehiclePricing> {
    await this.findOne(vehicleId); // vérifie que le véhicule existe

    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const pricing = this.vehiclePricingRepository.create({
      ...dto,
      vehicleId,
    });
    return this.vehiclePricingRepository.save(pricing);
  }

  async updatePricing(
    vehicleId: number,
    pricingId: number,
    dto: UpdateVehiclePricingDto,
  ): Promise<VehiclePricing> {
    const pricing = await this.vehiclePricingRepository.findOne({
      where: { id: pricingId, vehicleId },
    });
    if (!pricing)
      throw new NotFoundException(`Pricing #${pricingId} not found`);

    Object.assign(pricing, dto);
    return this.vehiclePricingRepository.save(pricing);
  }

  async removePricing(vehicleId: number, pricingId: number): Promise<void> {
    const pricing = await this.vehiclePricingRepository.findOne({
      where: { id: pricingId, vehicleId },
    });
    if (!pricing)
      throw new NotFoundException(`Pricing #${pricingId} not found`);
    await this.vehiclePricingRepository.remove(pricing);
  }

  // ─── CALCULATE PRICE ──────────────────────────────────────────────────────────
  async calculatePrice(
    vehicleId: number,
    startDate: Date,
    endDate: Date,
    currency: 'TND' | 'USD' | 'EUR' = 'TND',
  ): Promise<number> {
    const vehicle = await this.findOne(vehicleId);
    const pricings = await this.findPricings(vehicleId);

    let totalPrice = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current < end) {
      const rule = pricings.find(
        (p) =>
          new Date(p.startDate) <= current && new Date(p.endDate) >= current,
      );

      if (currency === 'TND') {
        totalPrice += rule
          ? Number(rule.pricePerDayTND)
          : Number(vehicle.basePricePerDayTND);
      } else if (currency === 'USD') {
        totalPrice += rule
          ? Number(rule.pricePerDayUSD)
          : Number(vehicle.basePricePerDayUSD);
      } else {
        totalPrice += rule
          ? Number(rule.pricePerDayEUR)
          : Number(vehicle.basePricePerDayEUR);
      }

      current.setDate(current.getDate() + 1);
    }

    return totalPrice;
  }

  async checkListVehicleAvailable(
    startDate: string,
    endDate: string,
  ): Promise<any[]> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // 🔹 1. récupérer véhicules dispo (sans conflit)
    const vehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.pricings', 'pricing')
      .leftJoin(
        'reservations',
        'reservation',
        `
      reservation.vehicleId = vehicle.id
      AND reservation.status NOT IN (:...statuses)
      AND reservation.startDate <= :endDate
      AND reservation.endDate >= :startDate
      `,
        {
          startDate,
          endDate,
          statuses: [ReservationStatus.CANCELLED],
        },
      )
      .where('vehicle.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('reservation.id IS NULL')
      .getMany();

    // 🔹 2. calcul du prix dynamique
    return vehicles.map((vehicle) => {
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      let totalTND = 0;
      let totalUSD = 0;
      let totalEUR = 0;

      // 🔥 calcul jour par jour (ultra précis)
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const currentDay = new Date(d);

        const pricing = vehicle.pricings.find((p) => {
          const pStart = new Date(p.startDate);
          const pEnd = new Date(p.endDate);
          return currentDay >= pStart && currentDay <= pEnd;
        });

        totalTND += pricing
          ? Number(pricing.pricePerDayTND)
          : Number(vehicle.basePricePerDayTND);

        totalUSD += pricing
          ? Number(pricing.pricePerDayUSD)
          : Number(vehicle.basePricePerDayUSD);

        totalEUR += pricing
          ? Number(pricing.pricePerDayEUR)
          : Number(vehicle.basePricePerDayEUR);
      }

      return {
        ...vehicle,

        // 🔹 prix par jour indicatif
        pricePerDayTND: Math.round(totalTND / days),
        pricePerDayUSD: Math.round(totalUSD / days),
        pricePerDayEUR: Math.round(totalEUR / days),

        // 🔹 prix total réel
        totalPriceTND: totalTND,
        totalPriceUSD: totalUSD,
        totalPriceEUR: totalEUR,
      };
    });
  }
  // ─── BULK PRICING ─────────────────────────────────────────────────────────────

  async createBulkPricing(dto: BulkPricingDto): Promise<VehiclePricing[]> {
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Si vehicleIds fournis → pricing pour ces véhicules
    // Sinon → pricing pour tous les véhicules
    let vehicles: Vehicle[];

    if (dto.vehicleIds && dto.vehicleIds.length > 0) {
      vehicles = await this.vehicleRepository.findByIds(dto.vehicleIds);
      if (vehicles.length !== dto.vehicleIds.length) {
        throw new NotFoundException('Some vehicles not found');
      }
    } else {
      vehicles = await this.vehicleRepository.find();
    }

    const pricings = vehicles.map((vehicle) =>
      this.vehiclePricingRepository.create({
        label: dto.label,
        startDate: dto.startDate,
        endDate: dto.endDate,
        pricePerDayTND: dto.pricePerDayTND,
        pricePerDayUSD: dto.pricePerDayUSD,
        pricePerDayEUR: dto.pricePerDayEUR,
        vehicleId: vehicle.id,
      }),
    );

    return this.vehiclePricingRepository.save(pricings);
  }

  async updateBulkPricing(
    dto: UpdateBulkPricingDto,
  ): Promise<VehiclePricing[]> {
    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) < new Date(dto.startDate)
    ) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Trouver les pricings à mettre à jour
    let pricings: VehiclePricing[];

    if (dto.vehicleIds && dto.vehicleIds.length > 0) {
      pricings = await this.vehiclePricingRepository
        .createQueryBuilder('pricing')
        .where('pricing.vehicleId IN (:...vehicleIds)', {
          vehicleIds: dto.vehicleIds,
        })
        .getMany();
    } else {
      pricings = await this.vehiclePricingRepository.find();
    }

    if (pricings.length === 0) {
      throw new NotFoundException('No pricings found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { vehicleIds: _, ...updateData } = dto;
    const updatedPricings = pricings.map((pricing) =>
      Object.assign(pricing, updateData),
    );

    return this.vehiclePricingRepository.save(updatedPricings);
  }

  async deleteBulkPricing(vehicleIds?: number[]): Promise<{ deleted: number }> {
    let pricings: VehiclePricing[];

    if (vehicleIds && vehicleIds.length > 0) {
      pricings = await this.vehiclePricingRepository
        .createQueryBuilder('pricing')
        .where('pricing.vehicleId IN (:...vehicleIds)', { vehicleIds })
        .getMany();
    } else {
      pricings = await this.vehiclePricingRepository.find();
    }

    if (pricings.length === 0) {
      return { deleted: 0 };
    }

    await this.vehiclePricingRepository.remove(pricings);
    return { deleted: pricings.length };
  }
}
