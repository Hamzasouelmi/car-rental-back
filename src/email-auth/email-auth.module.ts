import { Module } from '@nestjs/common';
import { EmailAuthService } from './email-auth.service';
import { EmailModule } from 'src/email/email.module';
import { JwtTokenModule } from 'src/shared/common/jwt-tokens/jwt-token.module';
import { UserModule } from 'src/users/user/user.module';

@Module({
  imports: [EmailModule, UserModule, JwtTokenModule],
  providers: [EmailAuthService],
  exports: [EmailAuthService],
})
export class EmailAuthModule {}
