import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import Role from 'src/auth/enum/role.enum';
import { RoleGuard } from 'src/shared/common/guards/role.guard';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  initiatePayment(@Body() dto: CreatePaymentDto) {
    return this.paymentService.initiatePayment(dto);
  }

  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Query('payment_ref') paymentRef: string) {
    return this.paymentService.handleWebhook(paymentRef);
  }

  @Get('success')
  @HttpCode(HttpStatus.OK)
  paymentSuccess(@Query('payment_ref') paymentRef: string) {
    return {
      message: 'Payment successful',
      paymentRef,
    };
  }

  @Get('fail')
  @HttpCode(HttpStatus.OK)
  paymentFail(@Query('payment_ref') paymentRef: string) {
    return {
      message: 'Payment failed',
      paymentRef,
    };
  }

  // ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.paymentService.findAll();
  }

  @Get('reservation/:reservationId')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  findByReservation(
    @Param('reservationId', ParseIntPipe) reservationId: number,
  ) {
    return this.paymentService.findByReservation(reservationId);
  }

  @Get(':id')
  @UseGuards(RoleGuard(Role.ADMIN))
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findOne(id);
  }

  // Route de test uniquement en développement
  @Get('webhook/test/:paymentRef')
  @HttpCode(HttpStatus.OK)
  handleWebhookTest(@Param('paymentRef') paymentRef: string) {
    return this.paymentService.handleWebhookTest(paymentRef);
  }
}
