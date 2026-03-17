import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SentMessageInfo } from 'nodemailer';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class EmailCreateUserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  sendSettingPasswordLink(
    email: string,
    token: string,
  ): Promise<SentMessageInfo> {
    const frontUrl = this.configService.get<string>('FRONT_APP_URL');
    const url = `${frontUrl}/reset-password?token=${token}`;

    const text = `Bonjour et bienvenue sur notre application de location de voiture,

Nous sommes ravis de vous accueillir sur notre plateforme.
Pour finaliser la configuration de votre compte, cliquez sur le lien ci-dessous :

${url}

Cordialement,
L'équipe Car Rental`;

    return this.emailService.sendMail({
      to: email,
      subject: 'Configuration de votre compte',
      from:
        this.configService.get<string>('EMAIL_FROM') ||
        this.configService.get<string>('EMAIL_USER'),
      text,
    });
  }
}
