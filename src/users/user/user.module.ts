import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtTokenModule } from 'src/shared/common/jwt-tokens/jwt-token.module';
import { EmailModule } from 'src/email/email.module';
import { UserService } from './user.service';
import { EmailCreateUserService } from 'src/email-create-user/email-create-user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtTokenModule, EmailModule],
  providers: [UserService, EmailCreateUserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
