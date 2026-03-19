import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { databaseConfig } from './shared/config/database.config';
import { ConfigModule } from '@nestjs/config';
import { __DEV__, __PROD__ } from './shared/constants/envs';
import Joi from 'joi'; // ✅ default import avec esModuleInterop
import { SeedingService } from './seed/seed.service';
import { User } from './users/user/user.entity';
import { UserModule } from './users/user/user.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { Vehicle } from './vehicle/entities/vehicle.entity';
import { VehiclePricing } from './vehicle/entities/vehicle-pricing.entity';
import { ReservationModule } from './reservation/reservation.module';
import { Reservation } from './reservation/reservation.entity';

const env = process.env.NODE_ENV || __DEV__;

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      ...(databaseConfig as TypeOrmModuleOptions),
      entities: [User, Vehicle, VehiclePricing, Reservation],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        APPLICATION_NAME: Joi.string().required(),
        PORT: Joi.number().required(),
        FRONT_APP_URL: Joi.string().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_RESET_TOKEN_SECRET: Joi.string().required(),
        JWT_RESET_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_VERIFICATION_TOKEN_SECRET: Joi.string().optional(),
        JWT_VERIFICATION_TOKEN_EXPIRATION_TIME: Joi.string().optional(),
        EMAIL_HOST: Joi.string().optional(),
        EMAIL_PORT: Joi.number().optional(),
        EMAIL_SECURE: Joi.boolean().optional(),
        EMAIL_USER: Joi.string().optional(),
        EMAIL_PASSWORD: Joi.string().optional(),
        POSTGRESQL_ADDON_URI: Joi.string().optional(),
      }).required(),
      ignoreEnvFile: env === __PROD__,
      envFilePath: `.${env}.env`,
    }),
    UserModule,
    AuthModule,
    VehicleModule,
    ReservationModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedingService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seedingService: SeedingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedingService.seed();
  }
}
