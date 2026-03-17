import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from 'src/types/token-payload';
import { VerificationTokenPayload } from 'src/types/verification-payload';

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  getJwtToken(userId: number) {
    const expirationInConfigValue = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION_TIME',
    );
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: expirationInConfigValue as any,
    });

    return {
      token,
    };
  }

  async getResetPasswordToken(email: string): Promise<string> {
    const secret = this.configService.get<string>('JWT_RESET_TOKEN_SECRET');
    const expiresIn = this.configService.get<string>(
      'JWT_RESET_TOKEN_EXPIRATION_TIME',
    );

    if (!secret) throw new Error('JWT_RESET_TOKEN_SECRET must be defined');
    if (!expiresIn)
      throw new Error('JWT_RESET_PASSWORD_EXPIRATION_TIME must be defined');

    const token = await this.jwtService.signAsync(
      { email },
      {
        secret,
        expiresIn: expiresIn as any,
      },
    );

    return token;
  }
  async getVerificationToken(email: string): Promise<string> {
    const secret = this.configService.get<string>(
      'JWT_VERIFICATION_TOKEN_SECRET',
    );
    const expiresIn = this.configService.get<string>(
      'JWT_VERIFICATION_TOKEN_EXPIRATION_TIME',
    );

    if (!secret)
      throw new Error('JWT_VERIFICATION_TOKEN_SECRET must be defined');
    if (!expiresIn)
      throw new Error('JWT_VERIFICATION_TOKEN_EXPIRATION_TIME must be defined');

    const payload: VerificationTokenPayload = { email };

    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as any,
    });

    return token;
  }
}
