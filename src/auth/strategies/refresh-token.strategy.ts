import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/users/user/user.service';
import { TokenPayload } from 'src/types/token-payload';
import { User } from 'src/users/user/user.entity';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_TOKEN_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_TOKEN_SECRET must be defined');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.Refresh as string,
      ]),
      secretOrKey: secret,
      passReqToCallback: true as const, // 👈 force le type littéral
    });
  }

  validate(request: Request, payload: TokenPayload): Promise<User> {
    const refreshToken = request?.cookies?.Refresh as string;
    return this.userService.getUserIfRefreshTokenMatches(
      payload.userId,
      refreshToken,
    );
  }
}
