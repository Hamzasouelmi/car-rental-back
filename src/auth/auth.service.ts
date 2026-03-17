import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { SignUpUserDTO } from './dto/signup-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { UserService } from 'src/users/user/user.service';
import { JwtTokenService } from 'src/shared/common/jwt-tokens/jwt-token.service';
import { User } from 'src/users/user/user.entity';
import { TokenPayload } from 'src/types/token-payload';
import { EmailAuthService } from 'src/email-auth/email-auth.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly usersService: UserService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailAuthService: EmailAuthService, // 👈 ajouter
  ) {}

  // ─── SIGNUP ──────────────────────────────────────────────────────────────────

  async signup(signupDto: SignUpUserDTO): Promise<User> {
    const existingUser = await this.usersService.findByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hash = await this.hashData(signupDto.password);
    const newUser = await this.usersService.create({
      ...signupDto,
      password: hash,
    });

    this.logger.log('New user created');
    return newUser;
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────────

  async getAuthenticatedUser(body: LoginUserDTO): Promise<User> {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) throw new BadRequestException('Wrong credentials');

    const isSamePassword = await bcrypt.compare(body.password, user.password);
    if (!isSamePassword) throw new BadRequestException('Wrong credentials');

    return user;
  }

  // ─── VALIDATE USER (JWT Strategy) ────────────────────────────────────────────

  async validateUser(payload: TokenPayload): Promise<User | null> {
    return this.usersService.findOne(payload.userId);
  }

  // ─── TOKENS ──────────────────────────────────────────────────────────────────

  getAccessToken(userId: number) {
    return this.jwtTokenService.getJwtToken(userId);
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`forgotPassword called for ${email}`);
    const user = await this.usersService.findByEmail(email);
    this.logger.log(`user found: ${JSON.stringify(user)}`);
    if (!user) return;

    try {
      const token = await this.jwtTokenService.getResetPasswordToken(email);
      await this.usersService.update(user.id, { resetToken: token } as any);
      await this.emailAuthService.sendResetPasswordLink(email, token); // 👈 ajouter
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error in forgotPassword for ${email}:`, error);
      throw error;
    }
  }
  // ─── RESET PASSWORD ──────────────────────────────────────────────────────────

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: { email: string };

    try {
      // 1. Supprimer le cast `as { email: string }` — inutile car déjà typé
      payload = this.jwtService.verify<{ email: string }>(token, {
        secret: this.configService.get<string>('JWT_RESET_TOKEN_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hash = await this.hashData(newPassword);

    // 2. `password` n'existe pas dans UpdateUserDto — on utilise une méthode dédiée
    await this.usersService.updatePassword(user.id, hash);
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private hashData(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }
}
