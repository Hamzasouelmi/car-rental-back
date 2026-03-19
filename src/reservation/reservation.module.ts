import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { VehicleModule } from '../vehicle/vehicle.module';
import { EmailAuthService } from '../email-auth/email-auth.service';
import { EmailModule } from '../email/email.module';
import { JwtTokenModule } from '../shared/common/jwt-tokens/jwt-token.module';
import { UserModule } from '../users/user/user.module';
import { Reservation } from './reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    VehicleModule,
    EmailModule,
    JwtTokenModule,
    UserModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService, EmailAuthService],
  exports: [ReservationService],
})
export class ReservationModule {}
