import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus } from './payment.entity';
import {
  Reservation,
  ReservationStatus,
} from 'src/reservation/reservation.entity';
import { EmailAuthService } from 'src/email-auth/email-auth.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger('PaymentService');
  private readonly konnectApiUrl = 'https://api.preprod.konnect.network/api/v2';
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly configService: ConfigService,
    private readonly emailAuthService: EmailAuthService, // 👈 ajouter
  ) {}

  // ─── INITIATE PAYMENT ────────────────────────────────────────────────────────

  async initiatePayment(
    dto: CreatePaymentDto,
  ): Promise<{ paymentUrl: string; paymentRef: string }> {
    // 1. récupérer la réservation
    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId },
      relations: ['vehicle'],
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation #${dto.reservationId} not found`,
      );
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Reservation is not in pending status');
    }

    // 2. convertir le montant en millimes (1 TND = 1000 millimes)
    const amountInMillimes = Math.round(
      Number(reservation.totalPriceTND) * 1000,
    );

    // 3. appeler l'API Konnect
    const apiKey = this.configService.get<string>('KONNECT_API_KEY');
    const walletId = this.configService.get<string>('KONNECT_WALLET_ID');
    const webhookUrl = this.configService.get<string>('KONNECT_WEBHOOK_URL');
    //const frontUrl = this.configService.get<string>('FRONT_APP_URL');

    const response = await fetch(
      `${this.konnectApiUrl}/payments/init-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey ?? '',
        },
        body: JSON.stringify({
          receiverWalletId: walletId,
          token: 'TND',
          amount: amountInMillimes,
          type: 'immediate',
          description: `Reservation #${reservation.id} - ${reservation.vehicle?.brand ?? ''} ${reservation.vehicle?.model ?? ''}`,
          acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
          lifespan: 30, // 30 minutes
          checkoutForm: true,
          addPaymentFeesToAmount: true,
          firstName: reservation.guestFirstName,
          lastName: reservation.guestLastName,
          phoneNumber: reservation.guestPhone,
          email: reservation.guestEmail,
          orderId: String(reservation.id),
          webhook: webhookUrl,
          theme: 'light',
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Konnect API error: ${response.status} ${response.statusText}`,
      );
      this.logger.error(`Konnect error body: ${errorBody}`);
      throw new BadRequestException('Payment initiation failed');
    }
    const data = (await response.json()) as {
      payUrl: string;
      paymentRef: string;
    };

    // 4. créer le paiement en base
    const payment = this.paymentRepository.create({
      reservationId: dto.reservationId,
      amountTND: reservation.totalPriceTND,
      status: PaymentStatus.PENDING,
      paymentRef: data.paymentRef,
      paymentUrl: data.payUrl,
    });

    await this.paymentRepository.save(payment);

    this.logger.log(`Payment initiated for reservation #${dto.reservationId}`);

    return {
      paymentUrl: data.payUrl,
      paymentRef: data.paymentRef,
    };
  }

  // ─── WEBHOOK ─────────────────────────────────────────────────────────────────

  async handleWebhook(paymentRef: string): Promise<void> {
    this.logger.log(`Webhook received for paymentRef: ${paymentRef}`);

    // 1. trouver le paiement
    const payment = await this.paymentRepository.findOne({
      where: { paymentRef },
    });

    if (!payment) {
      this.logger.error(`Payment not found for ref: ${paymentRef}`);
      return;
    }

    // 2. vérifier le statut du paiement via Konnect
    const apiKey = this.configService.get<string>('KONNECT_API_KEY');
    const response = await fetch(
      `${this.konnectApiUrl}/payments/${paymentRef}`,
      {
        headers: { 'x-api-key': apiKey ?? '' },
      },
    );

    const data = (await response.json()) as { payment: { status: string } };
    const konnectStatus = data?.payment?.status;

    this.logger.log(`Konnect payment status: ${konnectStatus}`);

    // 3. mettre à jour le paiement
    if (konnectStatus === 'completed') {
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);

      // 4. confirmer la réservation
      await this.reservationRepository.update(payment.reservationId, {
        status: ReservationStatus.CONFIRMED,
      });

      this.logger.log(`Reservation #${payment.reservationId} confirmed`);
    } else if (konnectStatus === 'failed') {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
      this.logger.log(
        `Payment failed for reservation #${payment.reservationId}`,
      );
    }
    if (konnectStatus === 'completed') {
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);

      await this.reservationRepository.update(payment.reservationId, {
        status: ReservationStatus.CONFIRMED,
      });

      // 👈 envoyer email de confirmation
      const reservation = await this.reservationRepository.findOne({
        where: { id: payment.reservationId },
        relations: ['vehicle'],
      });
      if (reservation) {
        await this.emailAuthService.sendPaymentConfirmation(
          reservation.guestEmail,
          reservation,
          payment,
        );
      }

      this.logger.log(`Reservation #${payment.reservationId} confirmed`);
    }
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────────

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['reservation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['reservation'],
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async findByReservation(reservationId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { reservationId },
      order: { createdAt: 'DESC' },
    });
  }

  async handleWebhookTest(paymentRef: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentRef },
    });

    if (!payment) {
      throw new NotFoundException(`Payment not found for ref: ${paymentRef}`);
    }

    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    await this.paymentRepository.save(payment);

    await this.reservationRepository.update(payment.reservationId, {
      status: ReservationStatus.CONFIRMED,
    });

    // 👈 envoyer email de confirmation
    const reservation = await this.reservationRepository.findOne({
      where: { id: payment.reservationId },
      relations: ['vehicle'],
    });
    if (reservation) {
      await this.emailAuthService.sendPaymentConfirmation(
        reservation.guestEmail,
        reservation,
        payment,
      );
    }

    this.logger.log(`[TEST] Reservation #${payment.reservationId} confirmed`);
  }
  async createAdminPaidPayment(reservation: Reservation) {
    const existingPaid = await this.paymentRepository.findOne({
      where: { reservationId: reservation.id, status: PaymentStatus.PAID },
    });

    if (!existingPaid) {
      const payment = this.paymentRepository.create({
        reservationId: reservation.id,
        amountTND: reservation.totalPriceTND,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      });
      await this.paymentRepository.save(payment);
      this.logger.log(
        `Payment PAID created for reservation #${reservation.id}`,
      );
    }
  }
}
