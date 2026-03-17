import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpUserDTO } from './dto/signup-user.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { UserService } from 'src/users/user/user.service';
import { EmailAuthService } from 'src/email-auth/email-auth.service';
import { LocalAuthGuard } from 'src/shared/common/guards/local-auth.guard';
import { GetCurrentUser } from 'src/shared/common/decorators/current-user.decorator';
import { User } from 'src/users/user/user.entity';
import { JwtAuthenticationGuard } from 'src/shared/common/guards/jwt.guard';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UserService,
    private readonly emailAuthService: EmailAuthService,
  ) {}

  // ─── SIGNUP ──────────────────────────────────────────────────────────────────

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async signUp(@Body() body: SignUpUserDTO) {
    const user = await this.authService.signup(body);
    await this.emailAuthService.sendVerificationLink(body.email);
    return user;
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────────

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@GetCurrentUser() user: User) {
    return this.authService.getAccessToken(user.id);
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    await this.authService.forgotPassword(body.email);
    return {
      message: 'If the email exists, a reset link has been sent.',
    };
  }

  // ─── RESET PASSWORD ──────────────────────────────────────────────────────────

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async resetPassword(@Body() body: ResetPasswordDTO) {
    await this.authService.resetPassword(body.token, body.password);
    return { message: 'Password reset successfully.' };
  }

  // ─── CONFIRM EMAIL ───────────────────────────────────────────────────────────

  @Post('/confirm-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async confirmEmail(@Body() body: { token: string }) {
    await this.emailAuthService.confirmEmail(body.token);
    return { message: 'Email confirmed successfully.' };
  }

  // ─── RESEND CONFIRMATION ─────────────────────────────────────────────────────

  @Post('/resend-confirmation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async resendConfirmation(@GetCurrentUser() user: User) {
    await this.emailAuthService.resendConfirmationLink(user.id);
    return { message: 'Confirmation email sent.' };
  }

  // ─── GET CURRENT USER ────────────────────────────────────────────────────────

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  getMe(@GetCurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }
}
