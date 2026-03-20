import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import { Payment } from 'src/payment/payment.entity';
import { Reservation } from 'src/reservation/reservation.entity';
import { JwtTokenService } from 'src/shared/common/jwt-tokens/jwt-token.service';
import { UserService } from 'src/users/user/user.service';

@Injectable()
export class EmailAuthService {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UserService,
  ) {}

  async confirmEmail(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.usersService.markEmailAsVerified(email);
  }

  async resendConfirmationLink(userId: number): Promise<void> {
    const user = await this.usersService.findOne(userId);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.sendVerificationLink(user.email);
  }

  async sendVerificationLink(email: string): Promise<void> {
    const token = await this.jwtTokenService.getVerificationToken(email);

    const frontUrl = this.configService.get<string>('FRONT_APP_URL');
    const url = `${frontUrl}/confirm?token=${token}`;
    const text = `Bienvenue sur notre application de location de voiture. 
Pour confirmer votre adresse email, cliquez ici : ${url}`;

    const fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('EMAIL_USER') ||
      'no-reply@car-rental.dev';

    await this.emailService.sendMail({
      to: email,
      subject: 'Confirmation de votre adresse email',
      from: fromEmail,
      text,
    });
  }

  async sendResetPasswordLink(email: string, token: string): Promise<void> {
    const frontUrl = this.configService.get<string>('FRONT_APP_URL');
    const url = `${frontUrl}/reset-password?token=${token}`;

    const text = `Bonjour,
Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.
Cliquez sur le lien ci-dessous pour le réinitialiser :

${url}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;

    const fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('EMAIL_USER') ||
      'no-reply@car-rental.dev';

    await this.emailService.sendMail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      from: fromEmail,
      text,
    });
  }

  // Email création réservation (en attente de paiement)
  async sendReservationCreated(
    email: string,
    reservation: Reservation,
  ): Promise<void> {
    const frontUrl = this.configService.get<string>('FRONT_APP_URL');
    const text = `Bonjour ${reservation.guestFirstName} ${reservation.guestLastName},

Votre réservation a été créée avec succès et est en attente de paiement.

Détails de la réservation :
- Véhicule : ${reservation.vehicle?.brand ?? ''} ${reservation.vehicle?.model ?? ''}
- Date de début : ${new Date(reservation.startDate).toLocaleDateString('fr-FR')}
- Date de fin : ${new Date(reservation.endDate).toLocaleDateString('fr-FR')}
- Prix total : ${String(reservation.totalPriceTND)} TND

Pour finaliser votre réservation, veuillez procéder au paiement :
${frontUrl ?? ''}/reservation/${String(reservation.id)}/payment

Cordialement,
L'équipe RentAcar`;

    await this.emailService.sendMail({
      to: email,
      subject: 'Réservation créée - En attente de paiement - RentAcar',
      from:
        this.configService.get<string>('EMAIL_FROM') ?? 'no-reply@rentacar.dev',
      text,
    });
  }

  // Email confirmation paiement
  async sendPaymentConfirmation(
    email: string,
    reservation: Reservation,
    payment: Payment,
  ): Promise<void> {
    const text = `Bonjour ${reservation.guestFirstName} ${reservation.guestLastName},

Votre paiement a été confirmé avec succès. Votre réservation est confirmée !

Détails de la réservation :
- Véhicule : ${reservation.vehicle?.brand ?? ''} ${reservation.vehicle?.model ?? ''}
- Date de début : ${new Date(reservation.startDate).toLocaleDateString('fr-FR')}
- Date de fin : ${new Date(reservation.endDate).toLocaleDateString('fr-FR')}
- Montant payé : ${String(payment.amountTND)} TND
- Référence paiement : ${payment.paymentRef ?? ''}

Merci pour votre confiance.

Cordialement,
L'équipe RentAcar`;

    await this.emailService.sendMail({
      to: email,
      subject: 'Paiement confirmé - Réservation confirmée - RentAcar',
      from:
        this.configService.get<string>('EMAIL_FROM') ?? 'no-reply@rentacar.dev',
      text,
    });
  }
}
