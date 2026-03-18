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

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehiclePricing)
    private readonly vehiclePricingRepository: Repository<VehiclePricing>,
  ) {}

  // ─── VEHICLE CRUD ─────────────────────────────────────────────────────────────

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { isAvailable: true },
      relations: ['pricings'],
    });
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
  ): Promise<number> {
    const vehicle = await this.findOne(vehicleId);
    const pricings = await this.findPricings(vehicleId);

    let totalPrice = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      // cherche une règle de prix pour ce jour
      const rule = pricings.find(
        (p) =>
          new Date(p.startDate) <= current && new Date(p.endDate) >= current,
      );

      // applique le prix de la règle ou le prix de base
      totalPrice += rule
        ? Number(rule.pricePerDay)
        : Number(vehicle.basePricePerDay);

      current.setDate(current.getDate() + 1);
    }

    return totalPrice;
  }
}
