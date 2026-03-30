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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import Role from '../auth/enum/role.enum';
import { RoleGuard } from 'src/shared/common/guards/role.guard';
import { Reservation, ReservationStatus } from './reservation.entity';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

  @Get('check-availability')
  @HttpCode(HttpStatus.OK)
  checkAvailability(
    @Query('vehicleId', ParseIntPipe) vehicleId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reservationService.checkAvailability(
      vehicleId,
      startDate,
      endDate,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() dto: CreateReservationDto) {
    return this.reservationService.create(dto);
  }

  // ─── ADMIN ROUTES ────────────────────────────────────────────────────────────
  @Post('adminCreate')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.CREATED)
  async createReservationByAdmin(
    @Body() dto: CreateReservationDto & { status?: ReservationStatus },
  ): Promise<Reservation> {
    return this.reservationService.createReservationByAdmin(dto);
  }
  @Get()
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.reservationService.findAll();
  }

  @Get(':id')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.remove(id);
  }
}
