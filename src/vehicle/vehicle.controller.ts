import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CreateVehiclePricingDto } from './dto/create-vehicle-pricing.dto';
import Role from 'src/auth/enum/role.enum';
import { RoleGuard } from 'src/shared/common/guards/role.guard';
import { UpdateVehiclePricingDto } from './dto/update-vehicle-pricing.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { BulkPricingDto, UpdateBulkPricingDto } from './dto/bulk-pricing.dto';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  // ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.vehicleService.findAll();
  }
  @Get('/available')
  findAvailable(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.vehicleService.findAvailableVehicles(startDate, endDate);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.findOne(id);
  }
  @Get('availableList')
  getAvailableVehicles(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.vehicleService.checkListVehicleAvailable(startDate, endDate);
  }
  // ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  findAllAdmin() {
    return this.vehicleService.findAllAdmin();
  }

  @Post()
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehicleService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.remove(id);
  }

  @Patch(':id/toggle-available')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  toggleAvailable(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.toggleAvailable(id);
  }

  // ─── PRICING ROUTES (ADMIN) ──────────────────────────────────────────────────

  @Get(':id/pricing')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  findPricings(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.findPricings(id);
  }

  @Post(':id/pricing')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.CREATED)
  createPricing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVehiclePricingDto,
  ) {
    return this.vehicleService.createPricing(id, dto);
  }

  @Patch(':id/pricing/:pricingId')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  updatePricing(
    @Param('id', ParseIntPipe) id: number,
    @Param('pricingId', ParseIntPipe) pricingId: number,
    @Body() dto: UpdateVehiclePricingDto,
  ) {
    return this.vehicleService.updatePricing(id, pricingId, dto);
  }

  @Delete(':id/pricing/:pricingId')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  removePricing(
    @Param('id', ParseIntPipe) id: number,
    @Param('pricingId', ParseIntPipe) pricingId: number,
  ) {
    return this.vehicleService.removePricing(id, pricingId);
  }
  @Get(':id/calculate-price')
  @HttpCode(HttpStatus.OK)
  calculatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.vehicleService.calculatePrice(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }
  @Post('pricing/bulk')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.CREATED)
  createBulkPricing(@Body() dto: BulkPricingDto) {
    return this.vehicleService.createBulkPricing(dto);
  }

  @Patch('pricing/bulk')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  updateBulkPricing(@Body() dto: UpdateBulkPricingDto) {
    return this.vehicleService.updateBulkPricing(dto);
  }

  @Delete('pricing/bulk')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  deleteBulkPricing(@Body() body: { vehicleIds?: number[] }) {
    return this.vehicleService.deleteBulkPricing(body.vehicleIds);
  }
}
