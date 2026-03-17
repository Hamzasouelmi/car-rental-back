import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, SentMessageInfo } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private nodemailerTransport: Mail;
  private isEmailConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const emailHost = configService.get<string>('EMAIL_HOST');
    const emailPort = configService.get<number>('EMAIL_PORT');
    const emailUser = configService.get<string>('EMAIL_USER');
    const emailPassword = configService.get<string>('EMAIL_PASSWORD');

    this.isEmailConfigured = !!(
      emailHost &&
      emailPort &&
      emailUser &&
      emailPassword
    );

    if (!this.isEmailConfigured) {
      this.logger.warn(
        'Email configuration not found. Emails will be logged to console only (not actually sent).',
      );
    } else {
      this.nodemailerTransport = createTransport({
        host: emailHost,
        port: emailPort,
        secure: configService.get<boolean>('EMAIL_SECURE', false),
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  async sendMail(
    options: nodemailer.SendMailOptions,
  ): Promise<SentMessageInfo> {
    if (!this.isEmailConfigured || !this.nodemailerTransport) {
      this.logger.log('📧 Email would be sent (mock mode):');
      this.logger.log(`   To: ${String(options.to)}`);
      this.logger.log(`   Subject: ${String(options.subject)}`);
      if (typeof options.text === 'string') {
        this.logger.log(`   Body: ${options.text.substring(0, 300)}...`);
      }
      return {
        messageId: 'mock-message-id',
        accepted: [options.to as string],
        rejected: [],
        pending: [],
        response: '250 Mock email logged (not actually sent)',
      };
    }

    try {
      return await this.nodemailerTransport.sendMail(options);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }
}
