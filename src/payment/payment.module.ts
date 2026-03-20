import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './payment.entity';
import { Reservation } from 'src/reservation/reservation.entity';

import { EmailAuthService } from '../email-auth/email-auth.service';
import { EmailModule } from '../email/email.module';
import { JwtTokenModule } from '../shared/common/jwt-tokens/jwt-token.module';
import { UserModule } from '../users/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Reservation]),
    EmailModule,
    JwtTokenModule,
    UserModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, EmailAuthService],
  exports: [PaymentService],
})
export class PaymentModule {}
