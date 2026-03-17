import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtTokenModule } from 'src/shared/common/jwt-tokens/jwt-token.module';
import { EmailModule } from 'src/email/email.module';
import { UserModule } from 'src/users/user/user.module';
import { EmailAuthService } from 'src/email-auth/email-auth.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtTokenModule,
    JwtModule.register({}),
    EmailModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    EmailAuthService,
    EmailService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
